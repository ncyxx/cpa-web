/**
 * 统计卡片容器组件
 * 8个卡片统一大小，清晰可读
 * UX: Minimum 16px body text, 4.5:1 contrast ratio
 */

import { useMemo, useState } from 'react'
import { Key, Bot, FileText, Activity, Zap, Timer, TrendingUp, DollarSign } from 'lucide-react'
import { calculateRecentPerMinuteRates, calculateTotalCost, loadModelPrices, formatPerMinuteValue, formatUsd } from '@/utils/usage'
import { ModelPricePanel } from '../ModelPricePanel'

interface StatsContainerProps {
  stats: {
    apiKeys: number | null
    authFiles: number | null
  }
  totalProviders: number
  usageStats: {
    total_requests?: number
    success_count?: number
    failure_count?: number
    total_tokens?: number
    apis?: Record<string, any>
  } | null
  loading?: boolean
}

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function MiniStatCard({ 
  icon, 
  label, 
  value, 
  sub,
  bg, 
  color, 
  gradientBg,
  loading,
  onClick
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  bg: string
  color: string
  gradientBg: string
  loading?: boolean
  onClick?: () => void
}) {
  const content = (
    <div 
      className={`rounded-xl border border-gray-100 p-4 h-full ${gradientBg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`text-xs font-medium ${color} block`}>{label}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {loading ? '...' : value}
          </p>
          {sub && !loading && (
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{sub}</p>
          )}
        </div>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )

  return content
}

export function StatsContainer({ stats, totalProviders, usageStats, loading }: StatsContainerProps) {
  const [pricesPanelOpen, setPricesPanelOpen] = useState(false)
  const [pricesVersion, setPricesVersion] = useState(0)

  const rateStats = useMemo(() => {
    if (!usageStats) return { rpm: 0, tpm: 0 }
    return calculateRecentPerMinuteRates(usageStats, 30)
  }, [usageStats])

  const { totalCost, hasPrices } = useMemo(() => {
    const modelPrices = loadModelPrices()
    const cost = usageStats ? calculateTotalCost(usageStats, modelPrices) : 0
    return { totalCost: cost, hasPrices: Object.keys(modelPrices).length > 0 }
  }, [usageStats, pricesVersion])

  const cardsData = [
    {
      icon: <Key className="w-4 h-4" />,
      label: 'API 密钥',
      value: stats.apiKeys ?? '-',
      path: '/admin/api-keys',
      bg: 'bg-blue-500',
      color: 'text-blue-600',
      gradientBg: 'bg-gradient-to-br from-blue-50 to-blue-100/50'
    },
    {
      icon: <Bot className="w-4 h-4" />,
      label: 'AI 提供商',
      value: totalProviders || '-',
      path: '/admin/ai-providers',
      bg: 'bg-purple-500',
      color: 'text-purple-600',
      gradientBg: 'bg-gradient-to-br from-purple-50 to-purple-100/50'
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: '认证文件',
      value: stats.authFiles ?? '-',
      path: '/admin/auth-files',
      bg: 'bg-green-500',
      color: 'text-green-600',
      gradientBg: 'bg-gradient-to-br from-green-50 to-green-100/50'
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: '总请求',
      value: usageStats?.total_requests?.toLocaleString() ?? '-',
      sub: usageStats ? `成功 ${usageStats.success_count} · 失败 ${usageStats.failure_count}` : undefined,
      path: '/admin/usage',
      bg: 'bg-orange-500',
      color: 'text-orange-600',
      gradientBg: 'bg-gradient-to-br from-orange-50 to-orange-100/50'
    },
    {
      icon: <Zap className="w-4 h-4" />,
      label: '总Token数',
      value: formatNumber(usageStats?.total_tokens ?? 0),
      sub: `总请求: ${usageStats?.total_requests ?? 0}`,
      bg: 'bg-violet-500',
      color: 'text-violet-600',
      gradientBg: 'bg-gradient-to-br from-violet-50 to-violet-100/50'
    },
    {
      icon: <Timer className="w-4 h-4" />,
      label: 'RPM',
      value: formatPerMinuteValue(rateStats.rpm),
      sub: '请求/分钟 (30min)',
      bg: 'bg-emerald-500',
      color: 'text-emerald-600',
      gradientBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50'
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'TPM',
      value: formatPerMinuteValue(rateStats.tpm),
      sub: 'Token/分钟 (30min)',
      bg: 'bg-amber-500',
      color: 'text-amber-600',
      gradientBg: 'bg-gradient-to-br from-amber-50 to-amber-100/50'
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: '总花费',
      value: formatUsd(totalCost),
      sub: hasPrices ? '基于模型价格计算' : '点击设置模型价格',
      bg: 'bg-rose-500',
      color: 'text-rose-600',
      gradientBg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
      onClick: () => setPricesPanelOpen(true)
    }
  ]

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        {cardsData.map((card, index) => (
          <MiniStatCard
            key={index}
            icon={card.icon}
            label={card.label}
            value={card.value}
            sub={card.sub}
            bg={card.bg}
            color={card.color}
            gradientBg={card.gradientBg}
            loading={loading}
            onClick={card.onClick}
          />
        ))}
      </div>
      
      <ModelPricePanel
        open={pricesPanelOpen}
        onClose={() => setPricesPanelOpen(false)}
        onSave={() => setPricesVersion(v => v + 1)}
      />
    </div>
  )
}
