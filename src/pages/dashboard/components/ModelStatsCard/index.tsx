/**
 * 模型系列统计卡片组件
 * 按模型系列（Claude、Gemini、GPT等）聚合显示统计
 * Bento Grid Style - Apple Design
 */

import { ChevronRight, Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react'

export interface ModelSeriesStats {
  requests: number
  success: number
  failure: number
  tokens: number
}

interface ModelStatsCardProps {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  data: ModelSeriesStats
  models?: string[]
  onDetailClick?: () => void
}

export function ModelStatsCard({ title, sub, icon, bg, color, headerBg, data, models, onDetailClick }: ModelStatsCardProps) {
  const successRate = data.requests > 0 ? Math.round((data.success / data.requests) * 100) : 0

  return (
    <div className="h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className={`px-4 py-3 bg-gradient-to-r ${headerBg} shrink-0`}>
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
          <button 
            onClick={onDetailClick}
            className={`flex items-center text-xs font-medium ${color} hover:opacity-80 cursor-pointer`}
          >
            详情 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="grid grid-cols-4 gap-1.5">
          <StatCell 
            icon={<Activity className="w-3.5 h-3.5" />} 
            label="总请求" 
            value={data.requests} 
            bg="bg-gray-50" 
            color="text-gray-700" 
          />
          <StatCell 
            icon={<TrendingUp className="w-3.5 h-3.5" />} 
            label="成功" 
            value={data.success} 
            bg="bg-green-50" 
            color="text-green-600"
            sub={data.requests > 0 ? `${successRate}%` : undefined}
          />
          <StatCell 
            icon={<TrendingDown className="w-3.5 h-3.5" />} 
            label="失败" 
            value={data.failure} 
            bg="bg-red-50" 
            color="text-red-500" 
          />
          <StatCell 
            icon={<Zap className="w-3.5 h-3.5" />} 
            label="Tokens" 
            value={data.tokens} 
            bg="bg-blue-50" 
            color="text-blue-600"
            isToken
          />
        </div>

        {models && models.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {models.map((model) => (
                <span 
                  key={model} 
                  className={`px-2 py-0.5 text-xs rounded-md ${bg} ${color} font-medium`}
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function StatCell({ icon, label, value, bg, color, sub, isToken }: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
  color: string
  sub?: string
  isToken?: boolean
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
