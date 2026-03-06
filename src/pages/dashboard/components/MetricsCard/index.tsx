/**
 * 指标统计卡片组件
 * 用于展示 总Token数、RPM、TPM、总花费
 * Bento Grid Style - Apple Design
 */

import { DollarSign, Zap, TrendingUp, Timer } from 'lucide-react'

interface MetricsCardProps {
  type: 'tokens' | 'rpm' | 'tpm' | 'cost'
  value: number
  subValue?: string
  loading?: boolean
}

const METRICS_CONFIG = {
  tokens: {
    label: '总Token数',
    icon: Zap,
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    iconBg: 'bg-purple-500',
    color: 'text-purple-600',
    progressColor: 'bg-purple-500'
  },
  rpm: {
    label: 'RPM',
    icon: Timer,
    bg: 'bg-gradient-to-br from-green-50 to-green-100/50',
    iconBg: 'bg-green-500',
    color: 'text-green-600',
    progressColor: 'bg-green-500'
  },
  tpm: {
    label: 'TPM',
    icon: TrendingUp,
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
    iconBg: 'bg-orange-500',
    color: 'text-orange-600',
    progressColor: 'bg-orange-500'
  },
  cost: {
    label: '总花费',
    icon: DollarSign,
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    iconBg: 'bg-amber-500',
    color: 'text-amber-600',
    progressColor: 'bg-amber-500'
  }
}

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatCost(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return `${value.toFixed(2)}`
}

export function MetricsCard({ type, value, subValue, loading }: MetricsCardProps) {
  const config = METRICS_CONFIG[type]
  const Icon = config.icon
  const displayValue = type === 'cost' ? formatCost(value) : formatNumber(value)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl shadow-sm border border-gray-100 p-5 bg-white ${config.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-gray-900">{displayValue}</span>
      </div>
      {subValue && (
        <p className="text-xs text-gray-500 mb-3">{subValue}</p>
      )}
      <div className="h-2 bg-gray-200/60 rounded-full overflow-hidden">
        <div 
          className={`h-full ${config.progressColor} rounded-full transition-all duration-500`}
          style={{ width: value > 0 ? '100%' : '0%' }}
        />
      </div>
    </div>
  )
}
