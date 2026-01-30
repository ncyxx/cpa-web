/**
 * Dashboard Data Hook (New Version)
 * Uses the new provider aggregator system
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore, useConfigStore } from '@/stores'
import { apiKeysApi, authFilesApi, usageApi } from '@/services/api'
import { fetchAllProviderData, type ProviderData, type ProviderType } from '@/services/api/providers'
import type { UsageStatistics } from '@/services/api/usage'

interface DashboardStats {
  apiKeys: number | null
  authFiles: number | null
}

interface DashboardData {
  connectionStatus: string
  apiBase: string
  serverVersion: string | null
  stats: DashboardStats
  usageStats: UsageStatistics | null
  providerData: Record<ProviderType, ProviderData>
  loading: boolean
  refresh: () => void
}

export function useDashboardDataNew(): DashboardData {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const serverVersion = useAuthStore((state) => state.serverVersion)
  const apiBase = useAuthStore((state) => state.apiBase)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)

  const [stats, setStats] = useState<DashboardStats>({ apiKeys: null, authFiles: null })
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null)
  const [providerData, setProviderData] = useState<Record<ProviderType, ProviderData>>({} as Record<ProviderType, ProviderData>)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch basic stats and usage in parallel
      const [keysRes, filesRes, usageRes, providers] = await Promise.allSettled([
        apiKeysApi.list(),
        authFilesApi.list(),
        usageApi.getUsage(),
        fetchAllProviderData()
      ])

      await fetchConfig()

      // Update basic stats
      setStats({
        apiKeys: keysRes.status === 'fulfilled' ? keysRes.value.length : null,
        authFiles: filesRes.status === 'fulfilled' ? filesRes.value.files.length : null
      })

      // Update usage stats
      if (usageRes.status === 'fulfilled') {
        setUsageStats(usageRes.value.usage)
      }

      // Update provider data
      if (providers.status === 'fulfilled') {
        setProviderData(providers.value)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchConfig])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [connectionStatus, fetchStats])

  return {
    connectionStatus,
    apiBase,
    serverVersion,
    stats,
    usageStats,
    providerData,
    loading,
    refresh: fetchStats
  }
}
