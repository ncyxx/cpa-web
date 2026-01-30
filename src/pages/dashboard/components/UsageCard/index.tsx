/**
 * 使用统计卡片组件
 * Bento Grid Style - Apple Design
 */

import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import type { UsageStatistics } from '@/services/api/usage'

interface UsageCardProps {
  stats: UsageStatistics
}

export function UsageCard({ stats }: UsageCardProps) {
  const successRate = stats.total_requests && stats.total_requests > 0
    ? Math.round((stats.success_count ?? 0) / stats.total_requests * 100)
    : 0

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">请求统计</h3>
            <p className="text-sm text-gray-500">Usage Statistics</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <StatBlock 
          icon={<Activity className="w-5 h-5" />}
          label="总请求" 
          value={stats.total_requests ?? 0} 
          color="text-gray-900"
          bg="bg-gray-50"
        />
        <StatBlock 
          icon={<TrendingUp className="w-5 h-5" />}
          label="成功" 
          value={stats.success_count ?? 0} 
          color="text-green-600"
          bg="bg-green-50"
          sub={`${successRate}%`}
        />
        <StatBlock 
          icon={<TrendingDown className="w-5 h-5" />}
          label="失败" 
          value={stats.failure_count ?? 0} 
          color="text-red-500"
          bg="bg-red-50"
        />
        <StatBlock 
          icon={<Zap className="w-5 h-5" />}
          label="Tokens" 
          value={stats.total_tokens ?? 0} 
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>
    </div>
  )
}

function StatBlock({ icon, label, value, color, bg, sub }: { 
  icon: React.ReactNode
  label: string
  value: number
  color: string
  bg: string
  sub?: string
}) {
  return (
    <div className={`p-4 rounded-2xl ${bg}`}>
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
        {sub && <span className="text-sm font-normal ml-2 opacity-70">{sub}</span>}
      </p>
    </div>
  )
}
