/**
 * 筛选和搜索栏组件
 */

import { Filter, Search, Trash2 } from 'lucide-react'
import { getTypeColor, getTypeLabel } from '../../utils'

interface FilterBarProps {
  existingTypes: string[]
  filter: string
  search: string
  filteredCount: number
  deleting: string | null
  onFilterChange: (type: string) => void
  onSearchChange: (value: string) => void
  onDeleteFiltered: () => void
}

export function FilterBar({
  existingTypes,
  filter,
  search,
  filteredCount,
  deleting,
  onFilterChange,
  onSearchChange,
  onDeleteFiltered
}: FilterBarProps) {
  return (
    <div className="p-4 border-b border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* 类型筛选 */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {existingTypes.map(type => {
            const isActive = filter.toLowerCase() === type.toLowerCase()
            const color = type === 'all' ? { bg: 'bg-gray-100', text: 'text-gray-600' } : getTypeColor(type)
            return (
              <button
                key={type}
                onClick={() => onFilterChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? `${color.bg} ${color.text} ring-2 ring-offset-1 ring-current`
                    : `${color.bg} ${color.text} hover:opacity-80`
                } ${color.border || ''}`}
              >
                {getTypeLabel(type)}
              </button>
            )
          })}
        </div>

        {/* 搜索框 */}
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="搜索文件名、邮箱..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
          />
        </div>

        {/* 批量删除 */}
        {filteredCount > 0 && (
          <button
            onClick={onDeleteFiltered}
            disabled={!!deleting}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            删除{filter !== 'all' ? ` ${getTypeLabel(filter)}` : '全部'}
          </button>
        )}
      </div>
    </div>
  )
}
