/**
 * 筛选和搜索栏组件
 */

import { Filter, Search } from 'lucide-react'
import { getTypeColor, getTypeLabel } from '../../utils'

interface FilterBarProps {
  existingTypes: string[]
  typeCounts: Record<string, number>
  filter: string
  search: string
  onFilterChange: (type: string) => void
  onSearchChange: (value: string) => void
  onOpenOAuthConfig: () => void
}

export function FilterBar({
  existingTypes,
  typeCounts,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onOpenOAuthConfig
}: FilterBarProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 lg:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm sm:flex">
            <Filter className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">文件类型</div>
            <div className="flex flex-wrap gap-2">
              {existingTypes.map((type) => {
                const isActive = filter.toLowerCase() === type.toLowerCase()
                const color = type === 'all' ? { bg: 'bg-slate-100', text: 'text-slate-700' } : getTypeColor(type)
                return (
                  <button
                    key={type}
                    onClick={() => onFilterChange(type)}
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : `border-transparent ${color.bg} ${color.text} hover:-translate-y-0.5 hover:shadow-sm`
                    } ${isActive ? '' : color.border || ''}`}
                  >
                    <span>{getTypeLabel(type)}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${isActive ? 'bg-white/15 text-white' : 'bg-white/80 text-current'}`}>
                      {typeCounts[type] || 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:items-center">
          <div className="relative w-full xl:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索文件名、邮箱..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <button
            onClick={onOpenOAuthConfig}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 px-3.5 text-sm font-medium text-orange-700 transition-all hover:border-orange-300 hover:bg-orange-100 cursor-pointer"
          >
            OAuth 配置
          </button>
        </div>
      </div>
    </div>
  )
}
