/**
 * 账号统计条组件
 * 显示负载率和成功率，带颜色指示
 */

import { 
  getLoadRateColor, 
  getSuccessRateColorClass, 
  formatPercent 
} from '@/utils/loadRate'

interface AccountStatsBarProps {
  /** 负载率 (0-100) */
  loadRate: number
  /** 成功率 (0-100) */
  successRate: number
  /** 成功请求数 */
  successCount: number
  /** 失败请求数 */
  failureCount: number
  /** 总请求数 */
  totalRequests: number
  /** 所有账号的总请求数 (用于 tooltip) */
  globalTotalRequests?: number
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 紧凑模式 */
  compact?: boolean
}

export function AccountStatsBar({
  loadRate,
  successRate,
  successCount,
  failureCount,
  totalRequests,
  globalTotalRequests,
  showDetails = true,
  compact = false
}: AccountStatsBarProps) {
  const loadRateColor = getLoadRateColor(loadRate)
  const successRateClass = getSuccessRateColorClass(successRate)
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* 负载率 */}
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: `${loadRateColor}15`,
            color: loadRateColor
          }}
          title={globalTotalRequests 
            ? `请求次数: ${totalRequests} / ${globalTotalRequests}` 
            : `请求次数: ${totalRequests}`
          }
        >
          {formatPercent(loadRate)}
        </span>
        
        {/* 成功率 */}
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${successRateClass}`}
          title={`成功: ${successCount}, 失败: ${failureCount}`}
        >
          ✓{successCount} ✗{failureCount}
        </span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-3">
      {/* 负载率 */}
      <div 
        className="flex items-center gap-1.5"
        title={globalTotalRequests 
          ? `请求次数: ${totalRequests} / ${globalTotalRequests}` 
          : `请求次数: ${totalRequests}`
        }
      >
        <span className="text-xs text-gray-500">负载</span>
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: loadRateColor }}
          />
          <span 
            className="text-xs font-semibold"
            style={{ color: loadRateColor }}
          >
            {formatPercent(loadRate)}
          </span>
        </div>
      </div>
      
      {/* 成功率 */}
      {showDetails && (
        <div 
          className="flex items-center gap-1.5"
          title={`成功: ${successCount}, 失败: ${failureCount}`}
        >
          <span className="text-xs text-gray-500">成功率</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${successRateClass}`}>
            {formatPercent(successRate)} (✓{successCount} ✗{failureCount})
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * 负载率进度条组件
 */
interface LoadRateProgressProps {
  loadRate: number
  totalRequests: number
  globalTotalRequests?: number
}

export function LoadRateProgress({ 
  loadRate, 
  totalRequests, 
  globalTotalRequests 
}: LoadRateProgressProps) {
  const color = getLoadRateColor(loadRate)
  
  return (
    <div 
      className="flex items-center gap-2"
      title={globalTotalRequests 
        ? `请求次数: ${totalRequests} / ${globalTotalRequests}` 
        : `请求次数: ${totalRequests}`
      }
    >
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${Math.min(loadRate, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
      <span 
        className="text-xs font-medium min-w-[40px] text-right"
        style={{ color }}
      >
        {formatPercent(loadRate)}
      </span>
    </div>
  )
}

/**
 * 状态徽章组件
 */
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'error' | 'expired' | string
  message?: string
}

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: '有效', className: 'text-green-600 bg-green-50' },
    inactive: { label: '禁用', className: 'text-gray-500 bg-gray-100' },
    error: { label: '错误', className: 'text-red-500 bg-red-50' },
    expired: { label: '过期', className: 'text-amber-600 bg-amber-50' }
  }
  
  const config = statusConfig[status] || { label: status, className: 'text-gray-500 bg-gray-100' }
  
  return (
    <span 
      className={`px-2 py-0.5 rounded text-xs font-medium ${config.className}`}
      title={message}
    >
      {config.label}
    </span>
  )
}
