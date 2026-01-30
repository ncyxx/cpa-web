/**
 * AI 号池页面
 * Bento Grid + Apple Design Style
 */

import { useCallback, useMemo } from 'react'
import { Database, RefreshCw, Zap, Bot, Sparkles, Code, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { PoolStatusCard, type AccountStatus, type PoolStatusData } from './components'
import { useAIPoolData } from './hooks'
import { useLoadRateStats } from '@/hooks'

export function AIPoolPage() {
  const { kiroTokens, authFiles, refreshing, refresh } = useAIPoolData()
  const { stats: loadStats } = useLoadRateStats({ autoLoad: true })

  // 转换账号状态
  const getAccountStatus = useCallback((
    item: { name?: string; id?: string; status?: string; is_expired?: boolean; disabled?: boolean; unavailable?: boolean; success_count?: number; failure_count?: number; success_rate?: number },
    totalRequests: number
  ): AccountStatus => {
    const name = item.name || item.id || ''
    const successCount = item.success_count ?? 0
    const failureCount = item.failure_count ?? 0
    const requests = successCount + failureCount
    const successRate = item.success_rate ?? (requests > 0 ? (successCount / requests) * 100 : 100)
    
    const sourceStats = loadStats?.bySource.get(name)
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
  
  const codexPoolData = useMemo(() => buildPoolData(
    authFiles.filter(f => f.provider?.toLowerCase() === 'codex' || f.type?.toLowerCase() === 'codex')
  ), [authFiles, buildPoolData])
  
  const claudePoolData = useMemo(() => buildPoolData(
    authFiles.filter(f => ['claude', 'anthropic'].includes(f.provider?.toLowerCase() || '') || 
                         ['claude', 'anthropic'].includes(f.type?.toLowerCase() || ''))
  ), [authFiles, buildPoolData])
  
  const geminiPoolData = useMemo(() => buildPoolData(
    authFiles.filter(f => ['gemini', 'gemini-cli'].includes(f.provider?.toLowerCase() || '') ||
                         ['gemini', 'gemini-cli'].includes(f.type?.toLowerCase() || ''))
  ), [authFiles, buildPoolData])

  // Provider 配置
  const providers = [
    { title: 'Kiro', sub: 'AWS CodeWhisperer', icon: <Zap className="w-5 h-5" />, bg: 'bg-violet-500', color: 'text-violet-600', headerBg: 'from-violet-50 to-purple-50', link: '/ai-providers/kiro', data: kiroPoolData },
    { title: 'Codex', sub: 'OpenAI Codex', icon: <Code className="w-5 h-5" />, bg: 'bg-emerald-500', color: 'text-emerald-600', headerBg: 'from-emerald-50 to-green-50', link: '/ai-providers/codex', data: codexPoolData },
    { title: 'Claude', sub: 'Anthropic Claude', icon: <Bot className="w-5 h-5" />, bg: 'bg-orange-500', color: 'text-orange-600', headerBg: 'from-orange-50 to-amber-50', link: '/ai-providers/claude', data: claudePoolData },
    { title: 'Gemini', sub: 'Google Gemini', icon: <Sparkles className="w-5 h-5" />, bg: 'bg-blue-500', color: 'text-blue-600', headerBg: 'from-blue-50 to-cyan-50', link: '/ai-providers/gemini', data: geminiPoolData }
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
          <button
            onClick={refresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-4 gap-4">
          <OverviewStat icon={<Database className="w-4 h-4" />} label="总账号" value={totalAccounts} color="text-gray-700" bg="bg-gray-100" />
          <OverviewStat icon={<CheckCircle className="w-4 h-4" />} label="正常" value={healthyAccounts} color="text-green-600" bg="bg-green-50" />
          <OverviewStat icon={<AlertTriangle className="w-4 h-4" />} label="耗尽" value={exhaustedAccounts} color="text-amber-600" bg="bg-amber-50" />
          <OverviewStat icon={<XCircle className="w-4 h-4" />} label="异常" value={unhealthyAccounts} color="text-red-500" bg="bg-red-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeProviders.length > 0 ? (
          activeProviders.map(provider => <PoolStatusCard key={provider.title} {...provider} />)
        ) : (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-gray-600 text-base font-medium">暂无账户数据</p>
            <p className="text-gray-400 text-sm mt-1">请先在配置中添加账户</p>
          </div>
        )}
      </div>
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
