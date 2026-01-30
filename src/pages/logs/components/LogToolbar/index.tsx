/**
 * 日志工具栏组件
 */

import { Search, RefreshCw, Download, Trash2, Timer, EyeOff, X } from 'lucide-react'

interface LogToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  autoRefresh: boolean
  onAutoRefreshChange: (enabled: boolean) => void
  hideManagement: boolean
  onHideManagementChange: (hide: boolean) => void
  onRefresh: () => void
  onDownload: () => void
  onClear: () => void
  loading?: boolean
  disabled?: boolean
  logsCount: number
}

export function LogToolbar({
  searchQuery,
  onSearchChange,
  autoRefresh,
  onAutoRefreshChange,
  hideManagement,
  onHideManagementChange,
  onRefresh,
  onDownload,
  onClear,
  loading,
  disabled,
  logsCount
}: LogToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索日志..."
          style={{ paddingLeft: '40px' }}
          className="w-full h-10 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
              hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* 工具按钮 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* 隐藏管理日志 */}
          <button
            onClick={() => onHideManagementChange(!hideManagement)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              transition-all duration-200 cursor-pointer
              ${hideManagement 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <EyeOff className="w-3.5 h-3.5" />
            隐藏管理
          </button>

          {/* 自动刷新 */}
          <button
            onClick={() => onAutoRefreshChange(!autoRefresh)}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <Timer className="w-3.5 h-3.5" />
            自动刷新
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 日志数量 */}
          <span className="text-xs text-gray-500 px-2">
            {logsCount} 条日志
          </span>

          {/* 刷新 */}
          <button
            onClick={onRefresh}
            disabled={disabled || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              bg-gray-100 text-gray-600 hover:bg-gray-200
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>

          {/* 下载 */}
          <button
            onClick={onDownload}
            disabled={logsCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              bg-blue-100 text-blue-700 hover:bg-blue-200
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            下载
          </button>

          {/* 清除 */}
          <button
            onClick={onClear}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
              bg-red-100 text-red-700 hover:bg-red-200
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清除
          </button>
        </div>
      </div>
    </div>
  )
}
