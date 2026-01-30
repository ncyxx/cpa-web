/**
 * AI 号池页面
 * Bento Grid + Apple Design Style
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { Database, RefreshCw, Zap, Bot, Sparkles, Code, CheckCircle, AlertTriangle, XCircle, Loader2, Settings, Save, X } from 'lucide-react'
import { PoolStatusCard, QuotaModal, type AccountStatus, type PoolStatusData } from './components'
import { useAIPoolData } from './hooks'
import { useLoadRateStats } from '@/hooks'
import { systemApi, type PoolConfig } from '@/services/api'
import type { AuthFile } from '@/services/api'

export function AIPoolPage() {
  const { kiroTokens, authFiles, refreshing, refresh } = useAIPoolData()
  const { stats: loadStats } = useLoadRateStats({ autoLoad: true })
  
  // 号池开关状态
  const [poolEnabled, setPoolEnabled] = useState(false)
  const [poolLoading, setPoolLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  
  // 号池配置参数
  const [poolConfig, setPoolConfig] = useState<PoolConfig>({
    enabled: false,
    providers: {
      kiro: {
        target_count: 100,
        replenish_threshold: 0.9,
        low_quota_threshold: 20,
        concurrency: 10,
        batch_size: 20
      }
    }
  })
  
  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProvider, setModalProvider] = useState('')
  const [modalAccounts, setModalAccounts] = useState<AuthFile[]>([])

  // 加载号池配置
  useEffect(() => {
    systemApi.getPoolConfig().then(config => {
      setPoolEnabled(config.enabled ?? false)
      setPoolConfig(config)
    }).catch(() => {})
  }, [])

  // 切换号池开关
  const togglePool = useCallback(async () => {
    setPoolLoading(true)
    try {
      const newEnabled = !poolEnabled
      await systemApi.updatePoolConfig({ ...poolConfig, enabled: newEnabled })
      setPoolEnabled(newEnabled)
      setPoolConfig(prev => ({ ...prev, enabled: newEnabled }))
    } catch (err) {
      console.error('Failed to toggle pool:', err)
    } finally {
      setPoolLoading(false)
    }
  }, [poolEnabled, poolConfig])

  // 保存配置
  const saveConfig = useCallback(async () => {
    setConfigSaving(true)
    try {
      await systemApi.updatePoolConfig(poolConfig)
      setShowConfig(false)
    } catch (err) {
      console.error('Failed to save config:', err)
    } finally {
      setConfigSaving(false)
    }
  }, [poolConfig])

  // 更新 Kiro 配置
  const updateKiroConfig = useCallback((key: string, value: number) => {
    setPoolConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        kiro: {
          ...prev.providers?.kiro,
          [key]: value
        }
      }
    }))
  }, [])

  // 打开配额模态框
  const openQuotaModal = useCallback((provider: string, accounts: any[]) => {
    setModalProvider(provider)
    setModalAccounts(accounts as AuthFile[])
    setModalOpen(true)
  }, [])

  // 转换账号状态
  const getAccountStatus = useCallback((
    item: { name?: string; id?: string; email?: string; status?: string; is_expired?: boolean; disabled?: boolean; unavailable?: boolean; success_count?: number; failure_count?: number; success_rate?: number; current_usage?: number; usage_limit?: number },
    totalRequests: number
  ): AccountStatus => {
    const name = item.name || item.id || ''
    const successCount = item.success_count ?? 0
    const failureCount = item.failure_count ?? 0
    const requests = successCount + failureCount
    const successRate = item.success_rate ?? (requests > 0 ? (successCount / requests) * 100 : 100)
    
    // 优先使用 email 查找负载率（与 usage API 的 source 字段匹配）
    const loadRateKey = item.email || name
    const sourceStats = loadStats?.bySource.get(loadRateKey)
    const loadRate = sourceStats?.loadRate ?? (totalRequests > 0 ? (requests / totalRequests) * 100 : 0)
    
    let status: AccountStatus['status'] = 'healthy'
    if (item.disabled) {
      status = 'disabled'
    } else if (item.unavailable || item.status === 'error' || item.status === 'invalid') {
      status = 'unhealthy'
    } else if (item.is_expired || item.status === 'exhausted') {
      status = 'exhausted'
    }
    
    return { id: name, name, status, loadRate, successRate, requests }
  }, [loadStats])

  // 构建各 Provider 数据
  const buildPoolData = useCallback((items: any[]): PoolStatusData => {
    const totalRequests = items.reduce((sum, item) => 
      sum + (item.success_count ?? 0) + (item.failure_count ?? 0), 0)
    return {
      accounts: items.map(item => getAccountStatus(item, totalRequests)),
      totalRequests,
      totalTokens: 0
    }
  }, [getAccountStatus])

  const kiroPoolData = useMemo(() => buildPoolData(kiroTokens), [kiroTokens, buildPoolData])
  
  const codexAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'codex' || f.type?.toLowerCase() === 'codex')
  , [authFiles])
  const codexPoolData = useMemo(() => buildPoolData(codexAccounts), [codexAccounts, buildPoolData])
  
  const claudeAccounts = useMemo(() => 
    authFiles.filter(f => ['claude', 'anthropic'].includes(f.provider?.toLowerCase() || '') || 
                         ['claude', 'anthropic'].includes(f.type?.toLowerCase() || ''))
  , [authFiles])
  const claudePoolData = useMemo(() => buildPoolData(claudeAccounts), [claudeAccounts, buildPoolData])
  
  const geminiAccounts = useMemo(() => 
    authFiles.filter(f => ['gemini', 'gemini-cli'].includes(f.provider?.toLowerCase() || '') ||
                         ['gemini', 'gemini-cli'].includes(f.type?.toLowerCase() || ''))
  , [authFiles])
  const geminiPoolData = useMemo(() => buildPoolData(geminiAccounts), [geminiAccounts, buildPoolData])

  const antigravityAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'antigravity' || f.type?.toLowerCase() === 'antigravity')
  , [authFiles])
  const antigravityPoolData = useMemo(() => buildPoolData(antigravityAccounts), [antigravityAccounts, buildPoolData])

  const qwenAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'qwen' || f.type?.toLowerCase() === 'qwen')
  , [authFiles])
  const qwenPoolData = useMemo(() => buildPoolData(qwenAccounts), [qwenAccounts, buildPoolData])

  const iflowAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'iflow' || f.type?.toLowerCase() === 'iflow')
  , [authFiles])
  const iflowPoolData = useMemo(() => buildPoolData(iflowAccounts), [iflowAccounts, buildPoolData])

  const vertexAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'vertex' || f.type?.toLowerCase() === 'vertex')
  , [authFiles])
  const vertexPoolData = useMemo(() => buildPoolData(vertexAccounts), [vertexAccounts, buildPoolData])

  const openaiAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'openai' || f.type?.toLowerCase() === 'openai')
  , [authFiles])
  const openaiPoolData = useMemo(() => buildPoolData(openaiAccounts), [openaiAccounts, buildPoolData])

  const ampcodeAccounts = useMemo(() => 
    authFiles.filter(f => f.provider?.toLowerCase() === 'ampcode' || f.type?.toLowerCase() === 'ampcode')
  , [authFiles])
  const ampcodePoolData = useMemo(() => buildPoolData(ampcodeAccounts), [ampcodeAccounts, buildPoolData])

  // Provider 配置
  const providers = [
    { title: 'Kiro', sub: 'AWS CodeWhisperer', icon: <Zap className="w-5 h-5" />, bg: 'bg-violet-500', color: 'text-violet-600', headerBg: 'from-violet-50 to-purple-50', link: '/ai-providers/kiro', data: kiroPoolData, rawAccounts: kiroTokens },
    { title: 'Codex', sub: 'OpenAI Codex', icon: <Code className="w-5 h-5" />, bg: 'bg-emerald-500', color: 'text-emerald-600', headerBg: 'from-emerald-50 to-green-50', link: '/ai-providers/codex', data: codexPoolData, rawAccounts: codexAccounts },
    { title: 'Claude', sub: 'Anthropic Claude', icon: <Bot className="w-5 h-5" />, bg: 'bg-orange-500', color: 'text-orange-600', headerBg: 'from-orange-50 to-amber-50', link: '/ai-providers/claude', data: claudePoolData, rawAccounts: claudeAccounts },
    { title: 'Gemini', sub: 'Google Gemini', icon: <Sparkles className="w-5 h-5" />, bg: 'bg-blue-500', color: 'text-blue-600', headerBg: 'from-blue-50 to-cyan-50', link: '/ai-providers/gemini', data: geminiPoolData, rawAccounts: geminiAccounts },
    { title: 'Antigravity', sub: 'Google Antigravity', icon: <Sparkles className="w-5 h-5" />, bg: 'bg-cyan-500', color: 'text-cyan-600', headerBg: 'from-cyan-50 to-sky-50', link: '/ai-providers', data: antigravityPoolData, rawAccounts: antigravityAccounts },
    { title: 'Qwen', sub: 'Alibaba Qwen', icon: <Bot className="w-5 h-5" />, bg: 'bg-indigo-500', color: 'text-indigo-600', headerBg: 'from-indigo-50 to-violet-50', link: '/ai-providers', data: qwenPoolData, rawAccounts: qwenAccounts },
    { title: 'iFlow', sub: 'iFlow AI', icon: <Zap className="w-5 h-5" />, bg: 'bg-pink-500', color: 'text-pink-600', headerBg: 'from-pink-50 to-rose-50', link: '/ai-providers', data: iflowPoolData, rawAccounts: iflowAccounts },
    { title: 'Vertex', sub: 'Google Vertex AI', icon: <Sparkles className="w-5 h-5" />, bg: 'bg-sky-500', color: 'text-sky-600', headerBg: 'from-sky-50 to-blue-50', link: '/ai-providers', data: vertexPoolData, rawAccounts: vertexAccounts },
    { title: 'OpenAI', sub: 'OpenAI Compatible', icon: <Code className="w-5 h-5" />, bg: 'bg-gray-700', color: 'text-gray-700', headerBg: 'from-gray-50 to-slate-50', link: '/ai-providers/openai', data: openaiPoolData, rawAccounts: openaiAccounts },
    { title: 'Ampcode', sub: 'Amp Code', icon: <Code className="w-5 h-5" />, bg: 'bg-teal-500', color: 'text-teal-600', headerBg: 'from-teal-50 to-emerald-50', link: '/ai-providers/ampcode', data: ampcodePoolData, rawAccounts: ampcodeAccounts }
  ]

  const activeProviders = providers.filter(p => p.data.accounts.length > 0)
  
  // 统计
  const totalAccounts = providers.reduce((sum, p) => sum + p.data.accounts.length, 0)
  const healthyAccounts = providers.reduce((sum, p) => sum + p.data.accounts.filter(a => a.status === 'healthy').length, 0)
  const exhaustedAccounts = providers.reduce((sum, p) => sum + p.data.accounts.filter(a => a.status === 'exhausted').length, 0)
  const unhealthyAccounts = providers.reduce((sum, p) => sum + p.data.accounts.filter(a => a.status === 'unhealthy').length, 0)

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI 号池</h2>
              <p className="text-sm text-gray-500 mt-0.5">管理所有 AI 服务账号的状态与负载</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 配置按钮 */}
            <button
              onClick={() => setShowConfig(true)}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer text-gray-600"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-4 gap-4">
          <OverviewStat icon={<Database className="w-4 h-4" />} label="总账号" value={totalAccounts} color="text-gray-700" bg="bg-gray-100" />
          <OverviewStat icon={<CheckCircle className="w-4 h-4" />} label="正常" value={healthyAccounts} color="text-green-600" bg="bg-green-50" />
          <OverviewStat icon={<AlertTriangle className="w-4 h-4" />} label="耗尽" value={exhaustedAccounts} color="text-amber-600" bg="bg-amber-50" />
          <OverviewStat icon={<XCircle className="w-4 h-4" />} label="异常" value={unhealthyAccounts} color="text-red-500" bg="bg-red-50" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeProviders.length > 0 ? (
            activeProviders.map(provider => (
              <PoolStatusCard 
                key={provider.title} 
                {...provider} 
                onManageClick={() => openQuotaModal(provider.title, provider.rawAccounts)}
              />
            ))
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-gray-600 text-base font-medium">暂无账户数据</p>
              <p className="text-gray-400 text-sm mt-1">请先在配置中添加账户</p>
            </div>
          )}
        </div>
      </div>

      {/* 配额管理模态框 */}
      <QuotaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        provider={modalProvider}
        accounts={modalAccounts}
        loadRates={useMemo(() => {
          const map = new Map<string, number>()
          // 优先使用 usage API 的数据
          loadStats?.bySource.forEach((stats, name) => {
            map.set(name, stats.loadRate)
          })
          // 如果 usage API 没有数据，使用 kiroTokens 的统计数据
          if (modalProvider.toLowerCase() === 'kiro' && map.size === 0) {
            const totalRequests = kiroTokens.reduce((sum, t) => 
              sum + (t.success_count ?? 0) + (t.failure_count ?? 0), 0)
            kiroTokens.forEach(token => {
              const requests = (token.success_count ?? 0) + (token.failure_count ?? 0)
              const loadRate = totalRequests > 0 ? (requests / totalRequests) * 100 : 0
              // 用 email 作为 key
              if (token.email) {
                map.set(token.email, loadRate)
              }
              // 也用 name 作为 key
              if (token.name) {
                map.set(token.name, loadRate)
              }
            })
          }
          return map
        }, [loadStats, modalProvider, kiroTokens])}
      />

      {/* 号池配置模态框 */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfig(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">号池配置</h3>
                  <p className="text-xs text-gray-500 mt-0.5">配置自动补号参数</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* 开关 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">启用号池</h4>
                  <p className="text-xs text-gray-500 mt-0.5">开启后将自动监控并补充账号</p>
                </div>
                <button
                  onClick={togglePool}
                  disabled={poolLoading}
                  className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                    poolEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  {poolLoading ? (
                    <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      poolEnabled ? 'left-6' : 'left-1'
                    }`} />
                  )}
                </button>
              </div>

              {/* Kiro 配置 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-500" />
                  Kiro 配置
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <ConfigInput
                    label="目标账号数"
                    description="号池维持的账号数量"
                    value={poolConfig.providers?.kiro?.target_count ?? 100}
                    onChange={(v) => updateKiroConfig('target_count', v)}
                    min={1}
                    max={1000}
                  />
                  <ConfigInput
                    label="补号阈值"
                    description="低于此比例时触发补号"
                    value={poolConfig.providers?.kiro?.replenish_threshold ?? 0.9}
                    onChange={(v) => updateKiroConfig('replenish_threshold', v)}
                    min={0.1}
                    max={1}
                    step={0.1}
                    format={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <ConfigInput
                    label="低配额阈值"
                    description="剩余配额低于此值标记为低配额"
                    value={poolConfig.providers?.kiro?.low_quota_threshold ?? 20}
                    onChange={(v) => updateKiroConfig('low_quota_threshold', v)}
                    min={1}
                    max={100}
                  />
                  <ConfigInput
                    label="并发数"
                    description="同时注册的账号数"
                    value={poolConfig.providers?.kiro?.concurrency ?? 10}
                    onChange={(v) => updateKiroConfig('concurrency', v)}
                    min={1}
                    max={50}
                  />
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowConfig(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={saveConfig}
                disabled={configSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewStat({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bg}`}>
      <div className={color}>{icon}</div>
      <div>
        <p className={`text-xl font-semibold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function ConfigInput({ 
  label, description, value, onChange, min, max, step = 1, format 
}: { 
  label: string
  description?: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block">{label}</label>
      {description && <p className="text-xs text-gray-400 mt-0.5 mb-2">{description}</p>}
      <div className="relative mt-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        {format && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {format(value)}
          </span>
        )}
      </div>
    </div>
  )
}
