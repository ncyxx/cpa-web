/**
 * 使用统计页面
 * 按模型显示请求统计卡片
 * Bento Grid Style - Apple Design System
 * 使用 Zustand store 缓存数据，避免刷新闪屏
 */

import { useEffect, useCallback, useRef } from 'react'
import { BarChart3, RefreshCw, Activity, TrendingUp, TrendingDown, Zap, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { create } from 'zustand'
import { usageApi, type UsageStatistics } from '@/services/api/usage'

interface UsageState {
  usage: UsageStatistics | null
  loading: boolean
  refreshing: boolean
  initialized: boolean
  setUsage: (usage: UsageStatistics | null) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInitialized: (initialized: boolean) => void
}

const useUsageStore = create<UsageState>((set) => ({
  usage: null,
  loading: true,
  refreshing: false,
  initialized: false,
  setUsage: (usage) => set({ usage }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInitialized: (initialized) => set({ initialized }),
}))

let isLoading = false

async function preloadUsageData(isRefresh = false) {
  const store = useUsageStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  
  if (isRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }
  
  try {
    const res = await usageApi.getUsage()
    store.setUsage(res.usage)
    store.setInitialized(true)
  } catch (e) {
    console.error('Failed to fetch usage:', e)
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
    isLoading = false
  }
}

interface ModelStats {
  name: string
  displayName: string
  requests: number
  tokens: number
  success: number
  failure: number
}

// 模型配置
const MODEL_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string; headerBg: string }> = {
  claude: {
    icon: <span className="text-lg font-bold">C</span>,
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    headerBg: 'from-orange-50 to-white'
  },
  gemini: {
    icon: <span className="text-lg font-bold">G</span>,
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    headerBg: 'from-blue-50 to-white'
  },
  gpt: {
    icon: <span className="text-lg font-bold">G</span>,
    bg: 'bg-green-100',
    color: 'text-green-600',
    headerBg: 'from-green-50 to-white'
  },
  default: {
    icon: <span className="text-lg font-bold">M</span>,
    bg: 'bg-purple-100',
    color: 'text-purple-600',
    headerBg: 'from-purple-50 to-white'
  }
}

function getModelConfig(modelName: string) {
  const lower = modelName.toLowerCase()
  if (lower.includes('claude') || lower.includes('sonnet') || lower.includes('opus') || lower.includes('haiku')) {
    return { ...MODEL_CONFIG.claude, displayName: 'Claude' }
  }
  if (lower.includes('gemini')) {
    return { ...MODEL_CONFIG.gemini, displayName: 'Gemini' }
  }
  if (lower.includes('gpt') || lower.includes('codex')) {
    return { ...MODEL_CONFIG.gpt, displayName: 'GPT' }
  }
  return { ...MODEL_CONFIG.default, displayName: modelName.split('-')[0] || 'Model' }
}

export function UsagePage() {
  const { usage, loading, refreshing, initialized } = useUsageStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadUsageData()
    }
  }, [initialized])

  const fetchUsage = useCallback((isRefresh = false) => {
    preloadUsageData(isRefresh)
  }, [])

  // 从 apis 数据中提取所有模型统计
  const modelStats: ModelStats[] = []
  if (usage?.apis) {
    Object.values(usage.apis).forEach((apiData: any) => {
      if (apiData.models) {
        Object.entries(apiData.models).forEach(([modelName, modelData]: [string, any]) => {
          const existing = modelStats.find(m => m.name === modelName)
          if (existing) {
            existing.requests += modelData.total_requests || 0
            existing.tokens += modelData.total_tokens || 0
          } else {
            modelStats.push({
              name: modelName,
              displayName: modelName,
              requests: modelData.total_requests || 0,
              tokens: modelData.total_tokens || 0,
              success: modelData.total_requests || 0,
              failure: 0
            })
          }
        })
      }
    })
  }

  // 按请求数排序
  modelStats.sort((a, b) => b.requests - a.requests)

  return (
    <div className="space-y-6 pb-8">
      {/* 页面头部 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">使用统计</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                共 <span className="font-medium text-gray-700">{usage?.total_requests ?? 0}</span> 次请求，
                <span className="font-medium text-amber-600">{(usage?.total_tokens ?? 0).toLocaleString()}</span> Tokens
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchUsage(true)}
            disabled={loading || refreshing}
            className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 模型卡片网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-gray-100 rounded mt-1.5 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : modelStats.length > 0 ? (
          <>
            {modelStats.map((model) => (
              <ModelStatsCard key={model.name} model={model} />
            ))}
          </>
        ) : (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
            <p className="text-gray-600 text-base font-medium">暂无使用数据</p>
            <p className="text-gray-400 text-sm mt-1">发送请求后将在此显示统计</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ModelStatsCard({ model }: { model: ModelStats }) {
  const config = getModelConfig(model.name)
  const successRate = model.requests > 0 ? Math.round((model.success / model.requests) * 100) : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`px-4 py-3 bg-gradient-to-r ${config.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{config.displayName}</h3>
              <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{model.name}</p>
            </div>
          </div>
          <Link 
            to="/admin/usage" 
            className={`flex items-center text-xs font-medium ${config.color} hover:opacity-80 cursor-pointer`}
          >
            详情 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-1.5">
          <StatCell icon={<Activity className="w-3.5 h-3.5" />} label="总请求" value={model.requests} bg="bg-gray-50" color="text-gray-700" />
          <StatCell icon={<TrendingUp className="w-3.5 h-3.5" />} label="成功" value={model.success} bg="bg-green-50" color="text-green-600" sub={model.requests > 0 ? `${successRate}%` : undefined} />
          <StatCell icon={<TrendingDown className="w-3.5 h-3.5" />} label="失败" value={model.failure} bg="bg-red-50" color="text-red-500" />
          <StatCell icon={<Zap className="w-3.5 h-3.5" />} label="Tokens" value={model.tokens} bg="bg-blue-50" color="text-blue-600" />
        </div>
      </div>
    </div>
  )
}

function StatCell({ icon, label, value, bg, color, sub }: { icon: React.ReactNode; label: string; value: number; bg: string; color: string; sub?: string }) {
  return (
    <div className={`py-2 px-1.5 rounded-lg ${bg} text-center`}>
      <div className={`flex items-center justify-center gap-0.5 ${color} mb-0.5`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-base font-semibold ${color}`}>
        {value.toLocaleString()}
        {sub && <span className="text-xs font-normal ml-0.5 opacity-70">{sub}</span>}
      </p>
    </div>
  )
}
