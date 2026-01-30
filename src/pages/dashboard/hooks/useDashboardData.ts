/**
 * Dashboard 数据获取 Hook
 * 
 * 安全优化：
 * - 敏感数据只存内存，不持久化
 * - 通过 ProtectedRoute 预加载数据，避免闪烁
 * - sessionStorage 只存非敏感的 UI 状态
 */

import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useAuthStore, useConfigStore } from '@/stores'
import { apiKeysApi, providersApi, authFilesApi, usageApi, kiroApi } from '@/services/api'
import type { UsageStatistics } from '@/services/api/usage'
import type { KiroToken } from '@/services/api/kiro'
import type { ProviderCardData } from '../components'

// 扩展的供应商数据，包含请求统计
export interface ProviderDataWithStats extends ProviderCardData {
  requests?: {
    total: number
    success: number
    failure: number
    tokens: number
  }
}

// 模型系列统计
export interface ModelSeriesData {
  requests: number
  success: number
  failure: number
  tokens: number
}

interface DashboardStats {
  apiKeys: number | null
  authFiles: number | null
}

interface DashboardState {
  stats: DashboardStats
  usageStats: UsageStatistics | null
  providerData: Record<string, ProviderDataWithStats>
  modelSeriesData: Record<string, ModelSeriesData>
  loading: boolean
  refreshing: boolean
  initialized: boolean
  setStats: (stats: DashboardStats) => void
  setUsageStats: (stats: UsageStatistics | null) => void
  setProviderData: (data: Record<string, ProviderDataWithStats>) => void
  setModelSeriesData: (data: Record<string, ModelSeriesData>) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

// 纯内存存储，不持久化敏感数据
export const useDashboardStore = create<DashboardState>((set) => ({
  stats: { apiKeys: null, authFiles: null },
  usageStats: null,
  providerData: {},
  modelSeriesData: {},
  loading: true,
  refreshing: false,
  initialized: false,
  setStats: (stats) => set({ stats }),
  setUsageStats: (usageStats) => set({ usageStats }),
  setProviderData: (providerData) => set({ providerData }),
  setModelSeriesData: (modelSeriesData) => set({ modelSeriesData }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () => set({ stats: { apiKeys: null, authFiles: null }, usageStats: null, providerData: {}, modelSeriesData: {}, loading: true, refreshing: false, initialized: false }),
}))

// 防止重复调用的锁
let isPreloading = false

/**
 * 根据模型名称确定模型系列
 * 基于后端 model_definitions_*.go 文件中的所有模型定义
 */
function getModelSeries(modelName: string): string {
  const m = modelName.toLowerCase()
  
  // Claude 系列 (包括 Kiro/Amazon Q 的 Claude 模型)
  // claude-*, sonnet-*, opus-*, haiku-*, amazonq-claude-*
  if (m.includes('claude') || m.includes('sonnet') || m.includes('opus') || m.includes('haiku')) {
    return 'claude'
  }
  
  // Gemini 系列 (Google)
  // gemini-2.5-*, gemini-3-*, gemini-pro-*, gemini-flash-*
  if (m.includes('gemini')) {
    return 'gemini'
  }
  
  // GPT 系列 (OpenAI / GitHub Copilot)
  // gpt-4.1, gpt-5, gpt-5.1, gpt-5.2, gpt-5-codex, gpt-5.1-codex-*
  if (m.includes('gpt')) {
    return 'gpt'
  }
  
  // Qwen 系列 (阿里)
  // qwen3-coder-*, qwen3-max, qwen3-vl-*, qwen3-32b, qwen3-235b-*
  if (m.includes('qwen')) {
    return 'qwen'
  }
  
  // DeepSeek 系列
  // deepseek-v3, deepseek-v3.1, deepseek-v3.2, deepseek-r1
  if (m.includes('deepseek')) {
    return 'deepseek'
  }
  
  // Kimi 系列 (Moonshot)
  // kimi-k2, kimi-k2-0905, kimi-k2-thinking
  if (m.includes('kimi')) {
    return 'kimi'
  }
  
  // GLM 系列 (智谱)
  // glm-4.6, glm-4.7
  if (m.includes('glm')) {
    return 'glm'
  }
  
  // MiniMax 系列
  // minimax-m2, minimax-m2.1
  if (m.includes('minimax')) {
    return 'minimax'
  }
  
  // Grok 系列 (xAI)
  // grok-code-fast-1
  if (m.includes('grok')) {
    return 'grok'
  }
  
  // Amazon Q 系列 (非 Claude 的)
  // amazonq-auto
  if (m.includes('amazonq')) {
    return 'amazonq'
  }
  
  // TStars 系列 (iFlow)
  if (m.includes('tstars')) {
    return 'tstars'
  }
  
  // Raptor 系列
  if (m.includes('raptor')) {
    return 'raptor'
  }
  
  return 'other'
}

// 预加载函数，供 ProtectedRoute 调用
export async function preloadDashboardData(fetchConfig: () => Promise<any>, isRefresh = false) {
  const store = useDashboardStore.getState()
  
  // 防止重复调用
  if (isPreloading && !isRefresh) return
  if (store.initialized && !isRefresh) return // 已加载过且非刷新，跳过
  
  isPreloading = true
  
  // 刷新时设置 refreshing，初次加载设置 loading
  if (isRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }
  
  try {
    try { await fetchConfig() } catch (e) {}

    const [keysRes, filesRes, geminiRes, codexRes, claudeRes, openaiRes, usageRes, kiroRes] = 
      await Promise.allSettled([
        apiKeysApi.list(),
        authFilesApi.list(),
        providersApi.getGeminiKeys(),
        providersApi.getCodexConfigs(),
        providersApi.getClaudeConfigs(),
        providersApi.getOpenAIProviders(),
        usageApi.getUsage(),
        kiroApi.listTokens()
      ])

    store.setStats({
      apiKeys: keysRes.status === 'fulfilled' ? keysRes.value.length : null,
      authFiles: filesRes.status === 'fulfilled' ? filesRes.value.files.length : null
    })

    // 获取 usage 数据中的 apis 统计
    const usageData = usageRes.status === 'fulfilled' ? usageRes.value.usage : null
    
    if (usageData) {
      store.setUsageStats(usageData)
    }

    const providers: Record<string, ProviderDataWithStats> = {}

    // 从 apis 数据中按模型名称聚合供应商统计
    const providerRequestStats: Record<string, { total: number; tokens: number }> = {}
    if (usageData?.apis) {
      Object.values(usageData.apis).forEach((apiData: any) => {
        if (apiData.models) {
          Object.entries(apiData.models).forEach(([modelName, modelData]: [string, any]) => {
            // 根据模型名称推断供应商
            let provider = 'unknown'
            const lowerModel = modelName.toLowerCase()
            if (lowerModel.includes('claude') || lowerModel.includes('sonnet') || lowerModel.includes('opus') || lowerModel.includes('haiku')) {
              provider = 'kiro' // Claude 模型通过 Kiro 调用
            } else if (lowerModel.includes('gemini')) {
              provider = 'gemini'
            } else if (lowerModel.includes('gpt') || lowerModel.includes('codex')) {
              provider = 'codex'
            } else if (lowerModel.includes('openai')) {
              provider = 'openai'
            }
            
            if (!providerRequestStats[provider]) {
              providerRequestStats[provider] = { total: 0, tokens: 0 }
            }
            providerRequestStats[provider].total += modelData.total_requests || 0
            providerRequestStats[provider].tokens += modelData.total_tokens || 0
          })
        }
      })
    }

    // 辅助函数：获取供应商的请求统计
    const getProviderRequests = (providerKey: string) => {
      const stats = providerRequestStats[providerKey]
      if (!stats || stats.total === 0) return undefined
      return {
        total: stats.total,
        success: stats.total, // API 没有单独的 success，暂用 total
        failure: 0,
        tokens: stats.tokens
      }
    }

    if (geminiRes.status === 'fulfilled') {
      const items = geminiRes.value || []
      if (items.length > 0) {
        providers.gemini = { 
          total: items.length, healthy: items.length, unhealthy: 0, exhausted: 0, totalUsage: 0, totalLimit: 0,
          requests: getProviderRequests('gemini')
        }
      }
    }
    if (codexRes.status === 'fulfilled') {
      const items = codexRes.value || []
      if (items.length > 0) {
        providers.codex = { 
          total: items.length, healthy: items.length, unhealthy: 0, exhausted: 0, totalUsage: 0, totalLimit: 0,
          requests: getProviderRequests('codex')
        }
      }
    }
    if (claudeRes.status === 'fulfilled') {
      const items = claudeRes.value || []
      if (items.length > 0) {
        providers.claude = { 
          total: items.length, healthy: items.length, unhealthy: 0, exhausted: 0, totalUsage: 0, totalLimit: 0,
          requests: getProviderRequests('claude')
        }
      }
    }
    if (openaiRes.status === 'fulfilled') {
      const items = openaiRes.value || []
      if (items.length > 0) {
        providers.openai = { 
          total: items.length, healthy: items.length, unhealthy: 0, exhausted: 0, totalUsage: 0, totalLimit: 0,
          requests: getProviderRequests('openai')
        }
      }
    }
    if (kiroRes.status === 'fulfilled') {
      const tokens = kiroRes.value.tokens || []
      if (tokens.length > 0) {
        // 从 usage API 获取 kiro 的 tokens 统计
        const kiroTokensFromUsage = providerRequestStats['kiro']?.tokens ?? 0
        
        const kiroData: ProviderDataWithStats = { 
          total: tokens.length, healthy: 0, unhealthy: 0, exhausted: 0, proCount: 0, totalUsage: 0, totalLimit: 0,
          requests: { total: 0, success: 0, failure: 0, tokens: kiroTokensFromUsage }
        }
        tokens.forEach((token: KiroToken) => {
          const status = token.status?.toLowerCase() || 'active'
          if (status === 'active' || status === 'valid' || status === 'healthy') kiroData.healthy++
          else if (status === 'exhausted') kiroData.exhausted++
          else kiroData.unhealthy++
          if ((token.subscription_title || '').toLowerCase().includes('pro')) kiroData.proCount = (kiroData.proCount || 0) + 1
          kiroData.totalUsage += token.current_usage ?? 0
          kiroData.totalLimit += token.usage_limit ?? 0
          // 从 token 本身获取请求统计
          const successCount = token.success_count ?? 0
          const failureCount = token.failure_count ?? 0
          kiroData.requests!.success += successCount
          kiroData.requests!.failure += failureCount
          kiroData.requests!.total += successCount + failureCount
        })
        providers.kiro = kiroData
      }
    }

    store.setProviderData(providers)

    // 计算模型系列统计（Claude、Gemini、GPT等）
    const modelSeries: Record<string, ModelSeriesData> = {}
    if (usageData?.apis) {
      Object.entries(usageData.apis).forEach(([, apiData]: [string, any]) => {
        if (apiData.models) {
          Object.entries(apiData.models).forEach(([modelName, modelData]: [string, any]) => {
            // 根据模型名称确定系列
            const series = getModelSeries(modelName)
            
            if (!modelSeries[series]) {
              modelSeries[series] = { requests: 0, success: 0, failure: 0, tokens: 0 }
            }
            
            const totalRequests = modelData.total_requests || 0
            const totalTokens = modelData.total_tokens || 0
            
            // 从 details 数组中计算成功/失败统计
            let successCount = 0
            let failureCount = 0
            
            if (Array.isArray(modelData.details)) {
              modelData.details.forEach((detail: any) => {
                if (detail?.failed === true) {
                  failureCount++
                } else {
                  successCount++
                }
              })
            } else {
              // 如果没有 details，假设全部成功
              successCount = totalRequests
            }
            
            modelSeries[series].requests += totalRequests
            modelSeries[series].success += successCount
            modelSeries[series].failure += failureCount
            modelSeries[series].tokens += totalTokens
          })
        }
      })
    }
    store.setModelSeriesData(modelSeries)

    store.setInitialized(true)
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
    isPreloading = false
  }
}

interface DashboardData {
  connectionStatus: string
  apiBase: string
  serverVersion: string | null
  stats: DashboardStats
  usageStats: UsageStatistics | null
  providerData: Record<string, ProviderDataWithStats>
  modelSeriesData: Record<string, ModelSeriesData>
  loading: boolean
  refreshing: boolean
  refresh: () => void
}

// 自动刷新间隔（毫秒）- 30秒
const AUTO_REFRESH_INTERVAL = 30_000

export function useDashboardData(): DashboardData {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const serverVersion = useAuthStore((state) => state.serverVersion)
  const apiBase = useAuthStore((state) => state.apiBase)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)

  const { stats, usageStats, providerData, modelSeriesData, loading, refreshing, initialized } = useDashboardStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    // 连接成功且未初始化时加载数据
    if (connectionStatus === 'connected' && !initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadDashboardData(fetchConfig)
    }
  }, [connectionStatus, initialized, fetchConfig])

  const refresh = useCallback(() => {
    // 刷新时传入 isRefresh=true，保留旧数据显示，后台加载新数据
    preloadDashboardData(fetchConfig, true)
  }, [fetchConfig])

  // 自动刷新：每30秒刷新一次数据
  useEffect(() => {
    if (connectionStatus !== 'connected' || !initialized) return

    const intervalId = setInterval(() => {
      preloadDashboardData(fetchConfig, true)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [connectionStatus, initialized, fetchConfig])

  return {
    connectionStatus,
    apiBase,
    serverVersion,
    stats,
    usageStats,
    providerData,
    modelSeriesData,
    loading,
    refreshing,
    refresh
  }
}
