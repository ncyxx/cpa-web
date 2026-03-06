/**
 * 统计卡片组件
 */

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  bg: string
  color: string
  gradientBg: string
}

export function StatCard({ icon, label, value, bg, color, gradientBg }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-gray-100 p-4 ${gradientBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`text-xs font-medium ${color} block`}>{label}</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
