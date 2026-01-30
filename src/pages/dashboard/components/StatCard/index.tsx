/**
 * 统计卡片组件
 * Bento Grid Style - Apple Design
 * 紧凑版本 - 用于 8 卡片网格
 */

import { Link } from 'react-router-dom'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  path?: string
  bg: string
  color: string
  gradientBg?: string
  loading?: boolean
  sub?: string
}

export function StatCard({ icon, label, value, path, bg, color, gradientBg, loading, sub }: StatCardProps) {
  const content = (
    <div className={`rounded-xl shadow-sm border border-gray-100 p-4 h-full transition-all hover:shadow-md cursor-pointer ${gradientBg || 'bg-white'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">
          {loading ? '...' : value}
        </p>
        {sub && !loading && (
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  )

  if (path) {
    return <Link to={path} className="block">{content}</Link>
  }
  return content
}
