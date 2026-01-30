/**
 * Kiro 账号列表组件
 * 显示所有 Kiro Token 的负载率、成功率和状态
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Trash2, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { kiroApi, type KiroToken } from '@/services/api/kiro'
import { useLoadRateStats } from '@/hooks'
import { 
  getLoadRateColor, 
  getSuccessRateColorClass, 
  formatPercent 
} from '@/utils/loadRate'

interface KiroAccountListProps {
  onRefresh?: () => void
}

export function KiroAccountList({ onRefresh }: KiroAccountListProps) {
  const [tokens, setTokens] = useState<KiroToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingTokens, setCheckingTokens] = useState<Set<string>>(new Set())
  
  const { 
    stats: loadStats, 
    totalRequests: globalTotalRequests,
    refresh: refreshLoadStats,
    loading: loadStatsLoading 
  } = useLoadRateStats({ autoLoad: true })
  
  const loadTokens = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await kiroApi.listTokens()
      setTokens(response.tokens || [])
    } catch (err: any) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    loadTokens()
  }, [loadTokens])
  
  const handleRefresh = async () => {
    await Promise.all([loadTokens(), refreshLoadStats()])
    onRefresh?.()
  }
  
  const handleCheckToken = async (tokenId: string) => {
    setCheckingTokens(prev => new Set(prev).add(tokenId))
    try {
      await kiroApi.checkTokenHealth(tokenId)
      await loadTokens()
    } finally {
      setCheckingTokens(prev => {
        const next = new Set(prev)
        next.delete(tokenId)
        return next
      })
    }
  }
  
  const handleDeleteToken = async (tokenId: string) => {
    if (!window.confirm('确定要删除这个 Token 吗？')) return
    try {
      await kiroApi.deleteToken(tokenId)
      await loadTokens()
    } catch (err: any) {
      alert(err?.message || '删除失败')
    }
  }
  
  // 计算每个 token 的负载率
  const getTokenLoadStats = (token: KiroToken) => {
    const tokenName = token.name || token.id
    const sourceStats = loadStats?.bySource.get(tokenName)
    
    if (sourceStats) {
      return sourceStats
    }
    
    // 如果没有从 usage 获取到，使用 token 自带的统计
    const successCount = token.success_count ?? 0
    const failureCount = token.failure_count ?? 0
    const totalRequests = successCount + failureCount
    
    return {
      id: tokenName,
      successCount,
      failureCount,
      totalRequests,
      successRate: token.success_rate ?? (totalRequests > 0 ? (successCount / totalRequests) * 100 : 100),
      loadRate: globalTotalRequests > 0 ? (totalRequests / globalTotalRequests) * 100 : 0
    }
  }
  
  // 计算所有 token 的总请求数 (用于负载率计算)
  const totalTokenRequests = tokens.reduce((sum, token) => {
    const stats = getTokenLoadStats(token)
    return sum + stats.totalRequests
  }, 0)
  
  if (loading && tokens.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <XCircle className="w-8 h-8 mb-2" />
        <p className="text-sm">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"
        >
          重试
        </button>
      </div>
    )
  }
  
  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-violet-300" />
        </div>
        <p className="text-lg font-medium">暂无 Token</p>
        <p className="text-sm mt-1">请先导入 Kiro Token</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-gray-500">
          共 {tokens.length} 个账号，总请求 {totalTokenRequests.toLocaleString()}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || loadStatsLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || loadStatsLoading) ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>
      
      {/* 账号列表 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订阅</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配额</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成功率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负载率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tokens.map(token => {
              const stats = getTokenLoadStats(token)
              const loadRateColor = getLoadRateColor(stats.loadRate)
              const successRateClass = getSuccessRateColorClass(stats.successRate)
              const isChecking = checkingTokens.has(token.name || token.id)
              
              return (
                <tr key={token.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* 账号 */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {token.email || token.name || token.id}
                      </span>
                      {token.provider && (
                        <span className="text-xs text-gray-400">{token.provider}</span>
                      )}
                    </div>
                  </td>
                  
                  {/* 订阅类型 */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {token.subscription_title || '-'}
                    </span>
                  </td>
                  
                  {/* 配额 */}
                  <td className="px-4 py-3">
                    {token.usage_limit !== undefined ? (
                      <span 
                        className="text-sm font-medium"
                        title={token.next_reset ? `重置时间: ${token.next_reset}` : undefined}
                      >
                        {token.current_usage ?? 0}/{token.usage_limit}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* 成功率 */}
                  <td className="px-4 py-3">
                    <span 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${successRateClass}`}
                      title={`成功: ${stats.successCount}, 失败: ${stats.failureCount}`}
                    >
                      {formatPercent(stats.successRate)} 
                      <span className="opacity-70">(✓{stats.successCount} ✗{stats.failureCount})</span>
                    </span>
                  </td>
                  
                  {/* 负载率 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(stats.loadRate, 100)}%`,
                            backgroundColor: loadRateColor
                          }}
                        />
                      </div>
                      <span 
                        className="text-xs font-semibold min-w-[40px]"
                        style={{ color: loadRateColor }}
                        title={`请求次数: ${stats.totalRequests} / ${totalTokenRequests}`}
                      >
                        {formatPercent(stats.loadRate)}
                      </span>
                    </div>
                  </td>
                  
                  {/* 状态 */}
                  <td className="px-4 py-3">
                    <TokenStatus token={token} />
                  </td>
                  
                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCheckToken(token.name || token.id)}
                        disabled={isChecking}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="检查状态"
                      >
                        {isChecking ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteToken(token.name || token.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TokenStatus({ token }: { token: KiroToken }) {
  const isExpired = token.is_expired === true
  const status = token.status?.toLowerCase() || 'active'
  
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-amber-600 bg-amber-50">
        <AlertTriangle className="w-3 h-3" />
        过期
      </span>
    )
  }
  
  if (status === 'error' || status === 'invalid') {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-red-500 bg-red-50"
        title={token.status_message}
      >
        <XCircle className="w-3 h-3" />
        错误
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-green-600 bg-green-50">
      <CheckCircle className="w-3 h-3" />
      有效
    </span>
  )
}
