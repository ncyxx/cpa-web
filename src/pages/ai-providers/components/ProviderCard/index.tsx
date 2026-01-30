/**
 * 提供商卡片组件
 */

import { ChevronRight } from 'lucide-react'
import type { ProviderConfig } from '../../constants'

interface ProviderCardProps {
  config: ProviderConfig
  count: number
  active?: boolean
  onClick: () => void
}

export function ProviderCard({ config, count, active, onClick }: ProviderCardProps) {
  const Icon = config.icon as React.ComponentType<{ className?: string }>
  
  return (
    <div 
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all cursor-pointer group ${
        active 
          ? `${config.gradientBg} border-${config.color.replace('text-', '')}/30 shadow-md` 
          : 'border-gray-100 hover:shadow-md bg-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
            <p className="text-xs text-gray-500">{config.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${config.color}`}>{count}</span>
          <ChevronRight className={`w-5 h-5 transition-colors ${active ? config.color : 'text-gray-400 group-hover:text-gray-600'}`} />
        </div>
      </div>
    </div>
  )
}
