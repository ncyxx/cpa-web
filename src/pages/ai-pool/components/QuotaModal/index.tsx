/**
 * 配额管理模态框
 * 显示各 Provider 的配额信息
 */

import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { apiCallApi, getApiCallErrorMessage, kiroApi, type AuthFile } from '@/services/api'
import {
  CODEX_USAGE_URL,
  CODEX_REQUEST_HEADERS,
  GEMINI_CLI_QUOTA_URL,
  GEMINI_CLI_REQUEST_HEADERS,
  ANTIGRAVITY_QUOTA_URLS,
  ANTIGRAVITY_REQUEST_HEADERS,
  resolveCodexChatgptAccountId,
  resolveCodexPlanType,
  resolveGeminiCliProjectId,
  formatResetTime,
  formatCodexResetLabel,
  normalizeNumberValue,
  normalizeStringValue,
  type CodexQuotaData,
  type CodexQuotaWindow,
  type GeminiCliBucket,
  type AntigravityGroup,
  type KiroQuotaData
} from '../../utils/quota'

interface QuotaModalProps {
  isOpen: boolean
  onClose: () => void
  provider: string
  accounts: AuthFile[]
}

type QuotaStatus = 'idle' | 'loading' | 'success' | 'error'

interface AccountQuota {
  accountId: string
  accountName: string
  status: QuotaStatus
  error?: string
  data?: CodexQuotaData | GeminiCliBucket[] | AntigravityGroup[] | KiroQuotaData
}

export function QuotaModal({ isOpen, onClose, provider, accounts }: QuotaModalProps) {
  const [quotas, setQuotas] = useState<AccountQuota[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 获取 auth_index
  const getAuthIndex = (file: AuthFile): string | null => {
    return (file as any).auth_index ?? (file as any).authIndex ?? null
  }

  // 获取 Codex 配额
  const fetchCodexQuota = useCallback(async (file: AuthFile): Promise<CodexQuotaData> => {
    const authIndex = getAuthIndex(file)
    if (!authIndex) throw new Error('缺少 auth_index')

    const accountId = resolveCodexChatgptAccountId(file)
    if (!accountId) throw new Error('缺少 ChatGPT Account ID')

    const planType = resolveCodexPlanType(file)

    const result = await apiCallApi.request({
      authIndex,
      method: 'GET',
      url: CODEX_USAGE_URL,
      header: {
        ...CODEX_REQUEST_HEADERS,
        'Chatgpt-Account-Id': accountId
      }
    })

    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(getApiCallErrorMessage(result))
    }

    const payload = result.body
    if (!payload) throw new Error('空响应')

    const rateLimit = payload.rate_limit ?? payload.rateLimit
    const codeReviewLimit = payload.code_review_rate_limit ?? payload.codeReviewRateLimit
    const windows: CodexQuotaWindow[] = []

    const addWindow = (id: string, label: string, window: any, limitReached?: boolean) => {
      if (!window) return
      const usedPercentRaw = normalizeNumberValue(window.used_percent ?? window.usedPercent)
      const isLimitReached = Boolean(limitReached) || window.allowed === false
      const usedPercent = usedPercentRaw ?? (isLimitReached ? 100 : null)
      windows.push({
        id,
        label,
        usedPercent,
        resetLabel: formatCodexResetLabel(window)
      })
    }

    addWindow('primary', '5小时限额', rateLimit?.primary_window ?? rateLimit?.primaryWindow, rateLimit?.limit_reached)
    addWindow('secondary', '周限额', rateLimit?.secondary_window ?? rateLimit?.secondaryWindow, rateLimit?.limit_reached)
    addWindow('code-review', '代码审查限额', codeReviewLimit?.primary_window ?? codeReviewLimit?.primaryWindow, codeReviewLimit?.limit_reached)

    return {
      planType: payload.plan_type ?? payload.planType ?? planType,
      windows
    }
  }, [])

  // 获取 Gemini CLI 配额
  const fetchGeminiCliQuota = useCallback(async (file: AuthFile): Promise<GeminiCliBucket[]> => {
    const authIndex = getAuthIndex(file)
    if (!authIndex) throw new Error('缺少 auth_index')

    const projectId = resolveGeminiCliProjectId(file)
    if (!projectId) throw new Error('缺少 Project ID')

    const result = await apiCallApi.request({
      authIndex,
      method: 'POST',
      url: GEMINI_CLI_QUOTA_URL,
      header: GEMINI_CLI_REQUEST_HEADERS,
      data: JSON.stringify({ project: projectId })
    })

    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(getApiCallErrorMessage(result))
    }

    const payload = result.body
    const buckets = Array.isArray(payload?.buckets) ? payload.buckets : []
    
    // 按 modelId 分组
    const groupedBuckets = new Map<string, GeminiCliBucket>()
    
    for (const bucket of buckets) {
      const modelId = normalizeStringValue(bucket.modelId ?? bucket.model_id)
      if (!modelId) continue
      
      const remainingFraction = normalizeNumberValue(bucket.remainingFraction ?? bucket.remaining_fraction)
      const remainingAmount = normalizeNumberValue(bucket.remainingAmount ?? bucket.remaining_amount)
      const resetTime = normalizeStringValue(bucket.resetTime ?? bucket.reset_time) ?? undefined
      
      // 简化 modelId 作为 label
      let label = modelId
      if (modelId.includes('flash')) label = 'Gemini Flash Series'
      else if (modelId.includes('pro')) label = 'Gemini Pro Series'
      
      const existing = groupedBuckets.get(label)
      if (!existing || (remainingFraction !== null && (existing.remainingFraction === null || remainingFraction < existing.remainingFraction))) {
        groupedBuckets.set(label, {
          id: modelId,
          label,
          remainingFraction,
          remainingAmount,
          resetTime,
          modelIds: existing ? [...(existing.modelIds || []), modelId] : [modelId]
        })
      } else if (existing.modelIds && !existing.modelIds.includes(modelId)) {
        existing.modelIds.push(modelId)
      }
    }

    return Array.from(groupedBuckets.values())
  }, [])

  // 获取 Antigravity 配额
  const fetchAntigravityQuota = useCallback(async (file: AuthFile): Promise<AntigravityGroup[]> => {
    const authIndex = getAuthIndex(file)
    if (!authIndex) throw new Error('缺少 auth_index')

    // Antigravity 配额分组定义
    const ANTIGRAVITY_QUOTA_GROUPS = [
      { id: 'claude-gpt', label: 'Claude/GPT', identifiers: ['claude-sonnet-4-5-thinking', 'claude-opus-4-5-thinking', 'claude-sonnet-4-5', 'gpt-oss-120b-medium'] },
      { id: 'gemini-3-pro', label: 'Gemini 3 Pro', identifiers: ['gemini-3-pro-high', 'gemini-3-pro-low'] },
      { id: 'gemini-2-5-flash', label: 'Gemini 2.5 Flash', identifiers: ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'] },
      { id: 'gemini-2-5-flash-lite', label: 'Gemini 2.5 Flash Lite', identifiers: ['gemini-2.5-flash-lite'] },
      { id: 'gemini-2-5-cu', label: 'Gemini 2.5 CU', identifiers: ['rev19-uic3-1p'] },
      { id: 'gemini-3-flash', label: 'Gemini 3 Flash', identifiers: ['gemini-3-flash'] },
      { id: 'gemini-image', label: 'Gemini 3 Pro Image', identifiers: ['gemini-3-pro-image'] }
    ]

    let lastError = ''
    
    for (const url of ANTIGRAVITY_QUOTA_URLS) {
      for (const body of [JSON.stringify({ projectId: 'bamboo-precept-lgxtn' }), JSON.stringify({ project: 'bamboo-precept-lgxtn' })]) {
        try {
          const result = await apiCallApi.request({
            authIndex,
            method: 'POST',
            url,
            header: ANTIGRAVITY_REQUEST_HEADERS,
            data: body
          })

          if (result.statusCode >= 200 && result.statusCode < 300) {
            const payload = result.body
            const models = payload?.models
            if (!models || typeof models !== 'object') continue

            const groups: AntigravityGroup[] = []
            
            // 按分组定义聚合
            for (const groupDef of ANTIGRAVITY_QUOTA_GROUPS) {
              let minFraction = 1
              let resetTime: string | undefined
              const matchedModels: string[] = []
              
              for (const [modelId, modelData] of Object.entries(models)) {
                const data = modelData as any
                const quotaInfo = data.quotaInfo ?? data.quota_info ?? data
                
                // 检查是否匹配该分组
                const matches = groupDef.identifiers.some(id => modelId.toLowerCase().includes(id.toLowerCase()))
                if (!matches) continue
                
                matchedModels.push(modelId)
                const fraction = normalizeNumberValue(quotaInfo.remainingFraction ?? quotaInfo.remaining_fraction ?? quotaInfo.remaining) ?? 1
                if (fraction < minFraction) {
                  minFraction = fraction
                  resetTime = normalizeStringValue(quotaInfo.resetTime ?? quotaInfo.reset_time) ?? undefined
                }
              }
              
              if (matchedModels.length > 0) {
                groups.push({
                  id: groupDef.id,
                  label: groupDef.label,
                  models: matchedModels,
                  remainingFraction: minFraction,
                  resetTime
                })
              }
            }

            if (groups.length > 0) return groups
          }
          
          lastError = getApiCallErrorMessage(result)
        } catch (err) {
          lastError = err instanceof Error ? err.message : '未知错误'
        }
      }
    }

    throw new Error(lastError || '获取配额失败')
  }, [])

  // 支持配额查询的 provider
  const QUOTA_SUPPORTED_PROVIDERS = ['kiro', 'codex', 'gemini', 'gemini-cli', 'antigravity']

  // 加载 Kiro 配额
  const loadKiroQuotas = useCallback(async () => {
    try {
      const res = await kiroApi.getTokensQuota()
      const quotaMap = new Map<string, KiroQuotaData>()
      
      for (const q of res.quotas || []) {
        quotaMap.set(q.name, {
          name: q.name,
          email: q.email,
          provider: q.provider,
          currentUsage: q.current_usage ?? 0,
          usageLimit: q.usage_limit ?? 0,
          subscriptionTitle: q.subscription_title,
          nextReset: q.next_reset,
          status: q.status === 'ok' ? 'ok' : q.status === 'expired' ? 'expired' : 'error',
          errorMessage: q.error_message
        })
      }
      
      return quotaMap
    } catch {
      return new Map<string, KiroQuotaData>()
    }
  }, [])

  // 加载配额
  const loadQuotas = useCallback(async () => {
    if (accounts.length === 0) return

    const providerLower = provider.toLowerCase()
    
    // 不支持配额查询的 provider 不需要加载
    if (!QUOTA_SUPPORTED_PROVIDERS.includes(providerLower)) return

    // Kiro 使用专门的 API
    if (providerLower === 'kiro') {
      setQuotas(accounts.map(acc => ({
        accountId: acc.name || '',
        accountName: acc.name || '',
        status: 'loading'
      })))
      
      const quotaMap = await loadKiroQuotas()
      
      setQuotas(accounts.map(acc => {
        const name = acc.name || ''
        const quota = quotaMap.get(name)
        if (quota) {
          return {
            accountId: name,
            accountName: name,
            status: quota.status === 'ok' ? 'success' as const : 'error' as const,
            data: quota,
            error: quota.errorMessage
          }
        }
        return {
          accountId: name,
          accountName: name,
          status: 'error' as const,
          error: '未找到配额信息'
        }
      }))
      return
    }    // 初始化状态
    setQuotas(accounts.map(acc => ({
      accountId: getAuthIndex(acc) || acc.name || '',
      accountName: acc.name || getAuthIndex(acc) || '',
      status: 'loading'
    })))

    // 并行获取配额
    const results = await Promise.allSettled(
      accounts.map(async (acc, index) => {
        const accountId = getAuthIndex(acc) || acc.name || ''
        const accountName = acc.name || accountId

        try {
          let data: CodexQuotaData | GeminiCliBucket[] | AntigravityGroup[]
          
          if (providerLower === 'codex') {
            data = await fetchCodexQuota(acc)
          } else if (providerLower === 'gemini' || providerLower === 'gemini-cli') {
            data = await fetchGeminiCliQuota(acc)
          } else if (providerLower === 'antigravity') {
            data = await fetchAntigravityQuota(acc)
          } else {
            throw new Error(`不支持的 Provider: ${provider}`)
          }

          return { index, accountId, accountName, status: 'success' as const, data }
        } catch (err) {
          return { 
            index, 
            accountId, 
            accountName, 
            status: 'error' as const, 
            error: err instanceof Error ? err.message : '未知错误' 
          }
        }
      })
    )

    // 更新状态
    setQuotas(prev => {
      const newQuotas = [...prev]
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { index, ...rest } = result.value
          newQuotas[index] = rest
        }
      }
      return newQuotas
    })
  }, [accounts, provider, fetchCodexQuota, fetchGeminiCliQuota, fetchAntigravityQuota])

  // 打开时加载
  useEffect(() => {
    if (isOpen && accounts.length > 0) {
      const providerLower = provider.toLowerCase()
      // 只有支持配额查询的 provider 才加载
      if (QUOTA_SUPPORTED_PROVIDERS.includes(providerLower)) {
        loadQuotas()
      }
    }
  }, [isOpen, accounts, provider, loadQuotas])

  // 复制账号信息
  const copyAccountInfo = useCallback((acc: AuthFile) => {
    const info = JSON.stringify(acc, null, 2)
    navigator.clipboard.writeText(info)
    setCopiedId(acc.name || '')
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  if (!isOpen) return null

  const providerLower = provider.toLowerCase()
  // 不支持配额查询的 provider 显示账号列表
  const showAccountList = !QUOTA_SUPPORTED_PROVIDERS.includes(providerLower)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框 - 固定大小 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] overflow-hidden mx-4 flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider} {showAccountList ? '账号管理' : '配额管理'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {showAccountList ? '点击复制账号信息' : `共 ${accounts.length} 个账号`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showAccountList && (
              <button
                onClick={loadQuotas}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 内容 - 固定高度滚动 */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {showAccountList ? (
            // 不支持配额查询: 显示账号列表，点击复制
            accounts.map((acc, index) => (
              <div 
                key={acc.name || index}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                onClick={() => copyAccountInfo(acc)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{acc.name || `账号 ${index + 1}`}</p>
                    <p className="text-sm text-gray-500 mt-0.5">点击复制账号信息</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                    {copiedId === acc.name ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 group-hover:text-violet-500" />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // 支持配额查询: 显示配额信息
            quotas.map((quota, index) => (
              <QuotaCard 
                key={quota.accountId || index} 
                quota={quota} 
                provider={providerLower}
              />
            ))
          )}

          {accounts.length === 0 && (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无账号</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// 配额卡片组件
function QuotaCard({ quota, provider }: { quota: AccountQuota; provider: string }) {
  if (quota.status === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
              <p className="text-xs text-gray-500">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (quota.status === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
              <p className="text-xs text-red-500 truncate">{quota.error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Kiro 配额
  if (provider === 'kiro' && quota.data) {
    const data = quota.data as KiroQuotaData
    const usagePercent = data.usageLimit > 0 ? Math.round((data.currentUsage / data.usageLimit) * 100) : 0
    const remaining = 100 - usagePercent
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
            {data.subscriptionTitle && (
              <span className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 bg-violet-100 text-violet-700">
                {data.subscriptionTitle}
              </span>
            )}
          </div>
        </div>
        
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 flex-shrink-0">使用量</span>
            <div className="flex-1" />
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
              <div 
                className={`h-full rounded-full transition-all ${
                  remaining <= 20 ? 'bg-red-500' :
                  remaining <= 50 ? 'bg-amber-500' :
                  'bg-violet-500'
                }`}
                style={{ width: `${remaining}%` }}
              />
            </div>
            <span className={`text-xs font-medium w-10 text-right flex-shrink-0 ${
              remaining <= 20 ? 'text-red-500' :
              remaining <= 50 ? 'text-amber-500' :
              'text-violet-600'
            }`}>
              {remaining}%
            </span>
            <span className="text-xs text-gray-400 w-8 flex-shrink-0">
              {data.nextReset ? formatResetTime(data.nextReset) : '-'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.currentUsage} / {data.usageLimit}
          </p>
        </div>
      </div>
    )
  }

  // Codex 配额
  if (provider === 'codex' && quota.data) {
    const data = quota.data as CodexQuotaData
    const windows = data.windows || []
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
            {data.planType && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                data.planType === 'team' ? 'bg-purple-100 text-purple-700' :
                data.planType === 'plus' ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {data.planType === 'team' ? 'Team' : data.planType === 'plus' ? 'Plus' : data.planType}
              </span>
            )}
          </div>
        </div>
        
        <div className="px-3 py-2">
          {windows.length > 0 ? (
            <div className="space-y-2">
              {windows.map(window => {
                const remaining = window.usedPercent !== null ? Math.max(0, 100 - window.usedPercent) : null
                return (
                  <div key={window.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{window.label}</span>
                    <div className="flex-1" />
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          remaining === null ? 'bg-gray-300' :
                          remaining <= 20 ? 'bg-red-500' :
                            remaining <= 50 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`}
                          style={{ width: `${remaining ?? 0}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-10 text-right flex-shrink-0 ${
                        remaining === null ? 'text-gray-400' :
                        remaining <= 20 ? 'text-red-500' :
                        remaining <= 50 ? 'text-amber-500' :
                        'text-emerald-600'
                      }`}>
                        {remaining !== null ? `${Math.round(remaining)}%` : '--'}
                      </span>
                      <span className="text-xs text-gray-400 w-8 flex-shrink-0">{window.resetLabel}</span>
                    </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">无配额数据</p>
          )}
        </div>
      </div>
    )
  }

  // Gemini CLI 配额
  if ((provider === 'gemini' || provider === 'gemini-cli') && quota.data) {
    const buckets = Array.isArray(quota.data) ? quota.data as GeminiCliBucket[] : []
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
        </div>
        
        <div className="px-3 py-2">
          {buckets.length > 0 ? (
            <div className="space-y-2">
              {buckets.map(bucket => {
                const percent = bucket.remainingFraction !== null ? Math.round(bucket.remainingFraction * 100) : null
                return (
                  <div key={bucket.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{bucket.label}</span>
                    <div className="flex-1" />
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percent === null ? 'bg-gray-300' :
                          percent <= 20 ? 'bg-red-500' :
                          percent <= 50 ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${percent ?? 0}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-10 text-right flex-shrink-0 ${
                      percent === null ? 'text-gray-400' :
                      percent <= 20 ? 'text-red-500' :
                      percent <= 50 ? 'text-amber-500' :
                      'text-blue-600'
                    }`}>
                      {percent !== null ? `${percent}%` : '--'}
                    </span>
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">
                      {bucket.resetTime ? formatResetTime(bucket.resetTime) : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">无配额数据</p>
          )}
        </div>
      </div>
    )
  }

  // Antigravity 配额
  if (provider === 'antigravity' && quota.data) {
    const groups = Array.isArray(quota.data) ? quota.data as AntigravityGroup[] : []
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
        <div className="px-3 py-2 bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
        </div>
        
        <div className="px-3 py-2">
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map(group => {
                const percent = Math.round(group.remainingFraction * 100)
                return (
                  <div key={group.id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 flex-shrink-0">{group.label}</span>
                    <div className="flex-1" />
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percent <= 20 ? 'bg-red-500' :
                          percent <= 50 ? 'bg-amber-500' :
                          'bg-cyan-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium w-10 text-right flex-shrink-0 ${
                      percent <= 20 ? 'text-red-500' :
                      percent <= 50 ? 'text-amber-500' :
                      'text-cyan-600'
                    }`}>
                      {percent}%
                    </span>
                    <span className="text-xs text-gray-400 w-8 flex-shrink-0">
                      {group.resetTime ? formatResetTime(group.resetTime) : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">无配额数据</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden w-[320px]">
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-gray-900 truncate">{quota.accountName}</p>
        <p className="text-xs text-gray-500 mt-0.5">无配额数据</p>
      </div>
    </div>
  )
}

export default QuotaModal
