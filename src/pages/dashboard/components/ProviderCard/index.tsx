/**
 * 供应商卡片组件
 * Bento Grid Style - Apple Design
 */

import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, AlertTriangle, Crown, ChevronRight } from 'lucide-react'

export interface ProviderCardData {
  total: number
  healthy: number
  unhealthy: number
  exhausted: number
  totalUsage: number
  totalLimit: number
  proCount?: number
}

interface ProviderCardProps {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  link: string
  data: ProviderCardData
}

export function ProviderCard({ title, sub, icon, bg, color, headerBg, link, data }: ProviderCardProps) {
  const pct = data.totalLimit > 0 ? Math.round((data.totalUsage / data.totalLimit) * 100) : 0
  
  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden transition-all hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
      <div className={`px-6 py-5 bg-gradient-to-r ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{sub}</p>
            </div>
          </div>
          <Link 
            to={link} 
            className={`flex items-center gap-1 text-sm font-medium ${color} hover:opacity-80 cursor-pointer transition-opacity`}
          >
            管理 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatItem label="总数" value={data.total} />
          <StatItem 
            label="健康" 
            value={data.healthy} 
            color="text-green-600" 
            icon={<CheckCircle className="w-5 h-5" />} 
          />
          <StatItem 
            label="耗尽" 
            value={data.exhausted} 
            color="text-amber-500" 
            icon={<AlertTriangle className="w-5 h-5" />} 
          />
          <StatItem 
            label="异常" 
            value={data.unhealthy} 
            color="text-red-500" 
            icon={<XCircle className="w-5 h-5" />} 
          />
        </div>

        {data.totalLimit > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">配额使用</span>
              <span className="text-sm font-medium text-gray-700">
                {data.totalUsage.toLocaleString()} / {data.totalLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-violet-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }} 
              />
            </div>
            <p className="text-sm text-gray-400 mt-1.5 text-right">{pct}% 已使用</p>
          </div>
        )}

        {data.proCount && data.proCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
            <Crown className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{data.proCount} 个 PRO 账户</span>
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ label, value, color = 'text-gray-900', icon }: { 
  label: string; value: number; color?: string; icon?: React.ReactNode 
}) {
  return (
    <div className="text-center p-3 rounded-2xl bg-gray-50/50">
      <p className={`text-2xl font-bold ${color} flex items-center justify-center gap-1`}>
        {icon}{value}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
