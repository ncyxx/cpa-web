/**
 * 负载率统计 Hook
 * 从 usage API 获取数据并计算各账号的负载率
 */

import { useState, useEffect, useCallback } from 'react'
import { usageApi } from '@/services/api'
import { 
  calculateLoadRateStats, 
  type LoadRateResult, 
  type AccountLoadStats,
  type UsageData 
} from '@/utils/loadRate'

interface UseLoadRateStatsOptions {
  /** 自动刷新间隔 (ms)，0 表示不自动刷新 */
  refreshInterval?: number
  /** 是否在挂载时自动加载 */
  autoLoad?: boolean
}

interface UseLoadRateStatsReturn {
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 负载率统计结果 */
  stats: LoadRateResult | null
  /** 所有账号的总请求数 */
  totalRequests: number
  /** 根据 source 获取账号统计 */
  getStatsBySource: (source: string) => AccountLoadStats | null
  /** 根据 auth_index 获取账号统计 */
  getStatsByAuthIndex: (authIndex: string | number) => AccountLoadStats | null
  /** 刷新数据 */
  refresh: () => Promise<void>
}

export function useLoadRateStats(options: UseLoadRateStatsOptions = {}): UseLoadRateStatsReturn {
  const { refreshInterval = 0, autoLoad = true } = options
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LoadRateResult | null>(null)
  
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await usageApi.getUsage()
      const usageData = (response?.usage ?? response) as UsageData
      const result = calculateLoadRateStats(usageData)
      setStats(result)
    } catch (err: any) {
      setError(err?.message || '获取使用统计失败')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // 初始加载
  useEffect(() => {
    if (autoLoad) {
      refresh()
    }
  }, [autoLoad, refresh])
  
  // 自动刷新
  useEffect(() => {
    if (refreshInterval <= 0) return
    
    const timer = setInterval(refresh, refreshInterval)
    return () => clearInterval(timer)
  }, [refreshInterval, refresh])
  
  const getStatsBySource = useCallback((source: string): AccountLoadStats | null => {
    return stats?.bySource.get(source) ?? null
  }, [stats])
  
  const getStatsByAuthIndex = useCallback((authIndex: string | number): AccountLoadStats | null => {
    const key = typeof authIndex === 'number' ? authIndex.toString() : authIndex
    return stats?.byAuthIndex.get(key) ?? null
  }, [stats])
  
  return {
    loading,
    error,
    stats,
    totalRequests: stats?.totalRequests ?? 0,
    getStatsBySource,
    getStatsByAuthIndex,
    refresh
  }
}
