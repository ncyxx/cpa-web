/**
 * 通用 Provider 账号列表组件
 * 显示所有账号的负载率、成功率和状态
 * 适用于 Codex, Claude, Gemini 等通过 auth-files 管理的 Provider
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { authFilesApi, type AuthFile } from '@/services/api/authFiles'
import { useLoadRateStats } from '@/hooks'
import { 
  getLoadRateColor, 
  getSuccessRateColorClass, 
  formatPercent 
} from '@/utils/loadRate'

interface ProviderAccountListProps {
  /** Provider 类型 (codex, claude, gemini 等) */
  providerType: string
  /** 刷新回调 */
  onRefresh?: () => void
  /** 主题色 */
  accentColor?: string
}

export function ProviderAccountList({ 
  providerType, 
  onRefresh,
  accentColor = '#8b5cf6'
}: ProviderAccountListProps) {
  const [files, setFiles] = useState<AuthFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())
  
  const { 
    stats: loadStats, 
    refresh: refreshLoadStats,
    loading: loadStatsLoading 
  } = useLoadRateStats({ autoLoad: true })
  
  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFilesApi.list()
      // 过滤出指定 provider 的文件
      const filtered = (response.files || []).filter(
        f => f.provider?.toLowerCase() === providerType.toLowerCase() ||
             f.type?.toLowerCase() === providerType.toLowerCase()
      )
      setFiles(filtered)
    } catch (err: any) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [providerType])
  
  useEffect(() => {
    loadFiles()
  }, [loadFiles])
  
  const handleRefresh = async () => {
    await Promise.all([loadFiles(), refreshLoadStats()])
    onRefresh?.()
  }
  
  const handleDeleteFile = async (fileName: string) => {
    if (!window.confirm(`确定要删除 ${fileName} 吗？`)) return
    
    setDeletingFiles(prev => new Set(prev).add(fileName))
    try {
      await authFilesApi.deleteFile(fileName)
      await loadFiles()
    } catch (err: any) {
      alert(err?.message || '删除失败')
    } finally {
      setDeletingFiles(prev => {
        const next = new Set(prev)
        next.delete(fileName)
        return next
      })
    }
  }
  
  // 计算每个文件的负载率
  const getFileLoadStats = useCallback((file: AuthFile) => {
    const fileName = file.name || file.id || ''
    const sourceStats = loadStats?.bySource.get(fileName)
    
    if (sourceStats) {
      return sourceStats
    }
    
    // 如果没有从 usage 获取到，使用文件自带的统计
    const successCount = file.success_count ?? 0
    const failureCount = file.failure_count ?? 0
    const totalRequests = successCount + failureCount
    
    return {
      id: fileName,
      successCount,
      failureCount,
      totalRequests,
      successRate: file.success_rate ?? (totalRequests > 0 ? (successCount / totalRequests) * 100 : 100),
      loadRate: 0 // 将在下面计算
    }
  }, [loadStats])
  
  // 计算所有文件的总请求数 (用于负载率计算)
  const totalFileRequests = useMemo(() => {
    return files.reduce((sum, file) => {
      const stats = getFileLoadStats(file)
      return sum + stats.totalRequests
    }, 0)
  }, [files, getFileLoadStats])
  
  if (loading && files.length === 0) {
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
  
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: `${accentColor}10` }}
        >
          <AlertTriangle className="w-8 h-8" style={{ color: `${accentColor}50` }} />
        </div>
        <p className="text-lg font-medium">暂无账号</p>
        <p className="text-sm mt-1">请先添加 {providerType.toUpperCase()} 账号</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-gray-500">
          共 {files.length} 个账号，总请求 {totalFileRequests.toLocaleString()}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成功率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负载率</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {files.map(file => {
              const stats = getFileLoadStats(file)
              // 重新计算负载率
              const loadRate = totalFileRequests > 0 
                ? (stats.totalRequests / totalFileRequests) * 100 
                : 0
              const loadRateColor = getLoadRateColor(loadRate)
              const successRateClass = getSuccessRateColorClass(stats.successRate)
              const isDeleting = deletingFiles.has(file.name)
              
              return (
                <tr key={file.name} className="hover:bg-gray-50/50 transition-colors">
                  {/* 账号 */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {file.email || file.name}
                      </span>
                      {file.account_id && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {file.account_id}
                        </span>
                      )}
                    </div>
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
                            width: `${Math.min(loadRate, 100)}%`,
                            backgroundColor: loadRateColor
                          }}
                        />
                      </div>
                      <span 
                        className="text-xs font-semibold min-w-[40px]"
                        style={{ color: loadRateColor }}
                        title={`请求次数: ${stats.totalRequests} / ${totalFileRequests}`}
                      >
                        {formatPercent(loadRate)}
                      </span>
                    </div>
                  </td>
                  
                  {/* 状态 */}
                  <td className="px-4 py-3">
                    <FileStatus file={file} />
                  </td>
                  
                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDeleteFile(file.name)}
                        disabled={isDeleting}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="删除"
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
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

function FileStatus({ file }: { file: AuthFile }) {
  if (file.disabled) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-gray-500 bg-gray-100">
        禁用
      </span>
    )
  }
  
  if (file.unavailable) {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-amber-600 bg-amber-50"
        title={file.status_message}
      >
        <AlertTriangle className="w-3 h-3" />
        不可用
      </span>
    )
  }
  
  if (file.status === 'error' || file.status === 'invalid') {
    return (
      <span 
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-red-500 bg-red-50"
        title={file.status_message}
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
