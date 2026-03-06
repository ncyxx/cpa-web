/**
 * 负载率计算工具
 * 负载率 = 该账号请求次数 / 所有账号总请求次数 * 100
 */

export interface AccountLoadStats {
  /** 账号标识 (source 或 auth_index) */
  id: string
  /** 成功请求数 */
  successCount: number
  /** 失败请求数 */
  failureCount: number
  /** 总请求数 */
  totalRequests: number
  /** 成功率 (0-100) */
  successRate: number
  /** 负载率 (0-100) */
  loadRate: number
}

export interface LoadRateResult {
  /** 所有账号的总请求数 */
  totalRequests: number
  /** 按 source 分组的统计 */
  bySource: Map<string, AccountLoadStats>
  /** 按 auth_index 分组的统计 */
  byAuthIndex: Map<string, AccountLoadStats>
}

export interface UsageDetail {
  timestamp: string
  source?: string
  auth_index?: string | number
  failed?: boolean
  tokens?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
}

export interface UsageData {
  total_requests?: number
  success_count?: number
  failure_count?: number
  apis?: Record<string, {
    total_requests?: number
    total_tokens?: number
    models?: Record<string, {
      total_requests?: number
      total_tokens?: number
      details?: UsageDetail[]
    }>
  }>
}

/**
 * 从 usage 数据中收集所有请求明细
 */
export function collectUsageDetails(usageData: UsageData | null | undefined): UsageDetail[] {
  if (!usageData?.apis) return []
  
  const details: UsageDetail[] = []
  
  Object.values(usageData.apis).forEach(apiEntry => {
    if (!apiEntry?.models) return
    
    Object.values(apiEntry.models).forEach(modelEntry => {
      if (!modelEntry?.details) return
      details.push(...modelEntry.details)
    })
  })
  
  return details
}

/**
 * 计算负载率统计
 */
export function calculateLoadRateStats(usageData: UsageData | null | undefined): LoadRateResult {
  const details = collectUsageDetails(usageData)
  
  const bySource = new Map<string, { success: number; failure: number }>()
  const byAuthIndex = new Map<string, { success: number; failure: number }>()
  
  let totalRequests = 0
  
  details.forEach(detail => {
    totalRequests++
    const isFailed = detail.failed === true
    
    // 按 source 统计
    if (detail.source) {
      const key = detail.source
      const bucket = bySource.get(key) || { success: 0, failure: 0 }
      if (isFailed) {
        bucket.failure++
      } else {
        bucket.success++
      }
      bySource.set(key, bucket)
    }
    
    // 按 auth_index 统计
    const authIndex = normalizeAuthIndex(detail.auth_index)
    if (authIndex) {
      const bucket = byAuthIndex.get(authIndex) || { success: 0, failure: 0 }
      if (isFailed) {
        bucket.failure++
      } else {
        bucket.success++
      }
      byAuthIndex.set(authIndex, bucket)
    }
  })
  
  // 转换为 AccountLoadStats
  const sourceStats = new Map<string, AccountLoadStats>()
  bySource.forEach((bucket, id) => {
    const total = bucket.success + bucket.failure
    sourceStats.set(id, {
      id,
      successCount: bucket.success,
      failureCount: bucket.failure,
      totalRequests: total,
      successRate: total > 0 ? (bucket.success / total) * 100 : 100,
      loadRate: totalRequests > 0 ? (total / totalRequests) * 100 : 0
    })
  })
  
  const authIndexStats = new Map<string, AccountLoadStats>()
  byAuthIndex.forEach((bucket, id) => {
    const total = bucket.success + bucket.failure
    authIndexStats.set(id, {
      id,
      successCount: bucket.success,
      failureCount: bucket.failure,
      totalRequests: total,
      successRate: total > 0 ? (bucket.success / total) * 100 : 100,
      loadRate: totalRequests > 0 ? (total / totalRequests) * 100 : 0
    })
  })
  
  return {
    totalRequests,
    bySource: sourceStats,
    byAuthIndex: authIndexStats
  }
}

/**
 * 标准化 auth_index 值
 */
function normalizeAuthIndex(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  return null
}

/**
 * 根据负载率获取颜色
 * 高负载 (红色) → 低负载 (绿色)
 */
export function getLoadRateColor(loadRate: number): string {
  if (loadRate >= 80) return '#ef4444' // red-500
  if (loadRate >= 60) return '#f97316' // orange-500
  if (loadRate >= 40) return '#eab308' // yellow-500
  if (loadRate >= 20) return '#84cc16' // lime-500
  return '#22c55e' // green-500
}

/**
 * 根据负载率获取 Tailwind 颜色类名
 */
export function getLoadRateColorClass(loadRate: number): string {
  if (loadRate >= 80) return 'text-red-500 bg-red-50'
  if (loadRate >= 60) return 'text-orange-500 bg-orange-50'
  if (loadRate >= 40) return 'text-yellow-600 bg-yellow-50'
  if (loadRate >= 20) return 'text-lime-600 bg-lime-50'
  return 'text-green-500 bg-green-50'
}

/**
 * 根据成功率获取颜色类名
 */
export function getSuccessRateColorClass(successRate: number): string {
  if (successRate >= 95) return 'text-green-600 bg-green-50'
  if (successRate >= 80) return 'text-lime-600 bg-lime-50'
  if (successRate >= 60) return 'text-yellow-600 bg-yellow-50'
  if (successRate >= 40) return 'text-orange-500 bg-orange-50'
  return 'text-red-500 bg-red-50'
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
