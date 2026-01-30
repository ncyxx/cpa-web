/**
 * Dashboard 页面 (New Version)
 * Uses the new modular provider system
 * Bento Grid Style - Apple Design System
 */

import { Key, Bot, FileText, Activity } from 'lucide-react'
import { useConfigStore } from '@/stores'
import { ConnectionCard, StatCard, ProviderStatsCard, UsageCard } from './components'
import { useDashboardDataNew } from './hooks'
import { getProviderConfig, PROVIDER_ORDER } from './constants'

export function DashboardPageNew() {
  const config = useConfigStore((state) => state.config)
  const { connectionStatus, apiBase, serverVersion, stats, usageStats, providerData, loading, refresh } = useDashboardDataNew()

  // Calculate total providers across all types
  const totalProviders = Object.values(providerData).reduce((sum, p) => sum + (p.stats?.total || 0), 0)

  // Filter and sort providers that have accounts
  const activeProviders = PROVIDER_ORDER
    .filter(key => providerData[key] && providerData[key].stats.total > 0)
    .map(key => ({ key, data: providerData[key] }))

  return (
    <div className="space-y-6 pb-8">
      {/* 连接状态 + 配置 */}
      <ConnectionCard
        connectionStatus={connectionStatus}
        apiBase={apiBase}
        serverVersion={serverVersion}
        config={config}
        loading={loading}
        onRefresh={refresh}
      />

      {/* 快速统计 - Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Key className="w-6 h-6" />}
          label="API 密钥"
          value={stats.apiKeys ?? '-'}
          path="/api-keys"
          bg="bg-blue-50"
          color="text-blue-600"
          loading={loading}
        />
        <StatCard
          icon={<Bot className="w-6 h-6" />}
          label="AI 提供商"
          value={totalProviders || '-'}
          path="/ai-providers"
          bg="bg-purple-50"
          color="text-purple-600"
          loading={loading}
        />
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          label="认证文件"
          value={stats.authFiles ?? '-'}
          path="/auth-files"
          bg="bg-green-50"
          color="text-green-600"
          loading={loading}
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="总请求"
          value={usageStats?.total_requests?.toLocaleString() ?? '-'}
          path="/usage"
          bg="bg-orange-50"
          color="text-orange-600"
          loading={loading}
          sub={usageStats ? `成功 ${usageStats.success_count} · 失败 ${usageStats.failure_count}` : undefined}
        />
      </div>

      {/* 供应商卡片 - Bento Grid */}
      {(activeProviders.length > 0 || usageStats) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeProviders.map(({ key, data }) => {
            const cfg = getProviderConfig(key)
            return (
              <ProviderStatsCard
                key={key}
                title={cfg.title}
                sub={cfg.sub}
                icon={cfg.icon}
                bg={cfg.bg}
                color={cfg.color}
                headerBg={cfg.headerBg}
                link={cfg.link}
                data={{
                  total: data.stats.total,
                  healthy: data.stats.healthy,
                  unhealthy: data.stats.unhealthy,
                  exhausted: data.stats.exhausted,
                  proCount: data.stats.proCount,
                  totalUsage: data.stats.totalUsage ?? 0,
                  totalLimit: data.stats.totalLimit ?? 0,
                  requests: {
                    total: (data.stats.successCount ?? 0) + (data.stats.failureCount ?? 0),
                    success: data.stats.successCount ?? 0,
                    failure: data.stats.failureCount ?? 0,
                    tokens: 0
                  }
                }}
              />
            )
          })}

          {/* 使用统计 */}
          {usageStats && <UsageCard stats={usageStats} />}
        </div>
      )}

      {/* 加载状态 */}
      {loading && !usageStats && activeProviders.length === 0 && (
        <div className="bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-gray-100 py-20 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-base mt-5">正在加载数据...</p>
        </div>
      )}

      {/* 空状态 */}
      {!loading && activeProviders.length === 0 && !usageStats && (
        <div className="bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-gray-100 py-20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-base">暂无供应商数据</p>
          <p className="text-gray-400 text-sm mt-1">请先配置 AI 提供商</p>
        </div>
      )}
    </div>
  )
}
