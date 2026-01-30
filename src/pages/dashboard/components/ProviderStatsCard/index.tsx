/**
 * 供应商统计卡片组件（通用）
 * 合并供应商信息 + 请求统计
 * Bento Grid Style - Apple Design
 */

import { Link } from 'react-router-dom'
import { 
  CheckCircle, XCircle, AlertTriangle, Crown, ChevronRight,
  Activity, TrendingUp, TrendingDown, Zap
} from 'lucide-react'

export interface ProviderStats {
  total: number
  healthy: number
  unhealthy: number
  exhausted: number
  proCount?: number
  totalUsage: number
  totalLimit: number
  requests?: {
    total: number
    success: number
    failure: number
    tokens: number
  }
}

interface ProviderStatsCardProps {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  link: string
  data: ProviderStats
}

export function ProviderStatsCard({ title, sub, icon, bg, color, headerBg, link, data }: ProviderStatsCardProps) {
  const pct = data.totalLimit > 0 ? Math.round((data.totalUsage / data.totalLimit) * 100) : 0
  const successRate = data.requests && data.requests.total > 0
    ? Math.round((data.requests.success / data.requests.total) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`px-4 py-3 bg-gradient-to-r ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
          <Link 
            to={link} 
            className={`flex items-center text-xs font-medium ${color} hover:opacity-80 cursor-pointer`}
          >
            管理 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">账户状态</p>
            <div className="grid grid-cols-2 gap-1.5">
              <MiniStat label="总数" value={data.total} />
              <MiniStat label="健康" value={data.healthy} color="text-green-600" icon={<CheckCircle className="w-3.5 h-3.5" />} />
              <MiniStat label="耗尽" value={data.exhausted} color="text-amber-500" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
              <MiniStat label="异常" value={data.unhealthy} color="text-red-500" icon={<XCircle className="w-3.5 h-3.5" />} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">请求统计</p>
            <div className="grid grid-cols-2 gap-1.5">
              <RequestStat icon={<Activity className="w-3.5 h-3.5" />} label="总请求" value={data.requests?.total ?? 0} bg="bg-gray-50" color="text-gray-700" />
              <RequestStat icon={<TrendingUp className="w-3.5 h-3.5" />} label="成功" value={data.requests?.success ?? 0} bg="bg-green-50" color="text-green-600" sub={data.requests?.total ? `${successRate}%` : undefined} />
              <RequestStat icon={<TrendingDown className="w-3.5 h-3.5" />} label="失败" value={data.requests?.failure ?? 0} bg="bg-red-50" color="text-red-500" />
              <RequestStat icon={<Zap className="w-3.5 h-3.5" />} label="Tokens" value={data.requests?.tokens ?? 0} bg="bg-blue-50" color="text-blue-600" isToken />
            </div>
          </div>
        </div>

        {(data.totalLimit > 0 || (data.proCount && data.proCount > 0)) && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            {data.totalLimit > 0 ? (
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">配额 {data.totalUsage.toFixed(0)}/{data.totalLimit}</span>
                  <span className={`font-medium ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-gray-600'}`}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : color.replace('text-', 'bg-')
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                  />
                </div>
              </div>
            ) : <div />}
            
            {typeof data.proCount === 'number' && data.proCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Crown className="w-3.5 h-3.5" />
                <span className="font-medium">{data.proCount} PRO</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color = 'text-gray-900', icon }: { 
  label: string; value: number; color?: string; icon?: React.ReactNode 
}) {
  return (
    <div className="text-center py-2 px-1 rounded-lg bg-gray-50/80">
      <p className={`text-base font-semibold ${color} flex items-center justify-center gap-0.5`}>
        {icon}{value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function RequestStat({ icon, label, value, bg, color, sub, isToken }: { 
  icon: React.ReactNode; label: string; value: number; bg: string; color: string; sub?: string; isToken?: boolean
}) {
  return (
    <div className={`py-2 px-1.5 rounded-lg ${bg} text-center`}>
      <div className={`flex items-center justify-center gap-0.5 ${color} mb-0.5`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-base font-semibold ${color}`}>
        {isToken ? formatTokens(value) : value.toLocaleString()}
        {sub && <span className="text-xs font-normal ml-0.5 opacity-70">{sub}</span>}
      </p>
    </div>
  )
}
