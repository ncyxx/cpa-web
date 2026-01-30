/**
 * 错误日志列表组件
 */

import { FileWarning, Download, RefreshCw, Calendar, HardDrive } from 'lucide-react'
import type { ErrorLogFile } from '../../hooks'

interface ErrorLogsListProps {
  logs: ErrorLogFile[]
  loading?: boolean
  onDownload: (name: string) => void
  onRefresh: () => void
}

// 格式化文件大小
const formatSize = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString('zh-CN')
  } catch {
    return time
  }
}

export function ErrorLogsList({ logs, loading, onDownload, onRefresh }: ErrorLogsListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">加载错误日志中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          共 {logs.length} 个错误日志文件
        </span>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            bg-gray-100 text-gray-600 hover:bg-gray-200
            transition-all duration-200 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {/* 列表 */}
      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 flex items-center justify-center">
              <FileWarning className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-500 text-sm">暂无错误日志</p>
            <p className="text-gray-400 text-xs mt-1">系统运行正常</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid gap-3">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl
                  hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* 图标 */}
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <FileWarning className="w-5 h-5 text-red-600" />
                  </div>

                  {/* 信息 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{log.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {log.size !== undefined && (
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatSize(log.size)}
                        </span>
                      )}
                      {log.modTime && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(log.modTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 下载按钮 */}
                <button
                  onClick={() => onDownload(log.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                    bg-blue-100 text-blue-700 hover:bg-blue-200
                    transition-all duration-200 cursor-pointer
                    opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
