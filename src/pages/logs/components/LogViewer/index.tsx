/**
 * 日志查看器组件
 */

import { useRef, useEffect } from 'react'
import { Copy, ChevronDown } from 'lucide-react'
import { LOG_LEVEL_COLORS } from '../../constants'
import type { ParsedLogLine } from '../../hooks'

interface LogViewerProps {
  logs: ParsedLogLine[]
  loading?: boolean
  onCopyLine?: (line: string) => void
}

// 状态码颜色
const getStatusColor = (code?: number) => {
  if (!code) return ''
  if (code >= 500) return 'text-red-600'
  if (code >= 400) return 'text-amber-600'
  if (code >= 300) return 'text-blue-600'
  if (code >= 200) return 'text-green-600'
  return 'text-gray-600'
}

// HTTP 方法颜色
const getMethodColor = (method?: string) => {
  switch (method) {
    case 'GET': return 'text-green-600 bg-green-50'
    case 'POST': return 'text-blue-600 bg-blue-50'
    case 'PUT': return 'text-amber-600 bg-amber-50'
    case 'PATCH': return 'text-purple-600 bg-purple-50'
    case 'DELETE': return 'text-red-600 bg-red-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

export function LogViewer({ logs, loading, onCopyLine }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // 检查是否在底部
  const checkIsAtBottom = () => {
    const container = containerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 50
  }

  // 滚动到底部
  const scrollToBottom = () => {
    const container = containerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  // 监听滚动
  const handleScroll = () => {
    isAtBottomRef.current = checkIsAtBottom()
  }

  // 日志更新时自动滚动
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom()
    }
  }, [logs])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">加载日志中...</span>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl overflow-hidden">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 flex items-center justify-center">
            <ChevronDown className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">暂无日志</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-auto font-mono text-xs bg-gray-900 rounded-xl p-4"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="space-y-1">
        {logs.map((log, index) => {
          const levelColors = log.level ? LOG_LEVEL_COLORS[log.level] : null
          
          return (
            <div
              key={index}
              className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              {/* 时间戳 */}
              {log.timestamp && (
                <span className="text-gray-500 shrink-0 w-[140px]">
                  {log.timestamp}
                </span>
              )}

              {/* 日志级别 */}
              {log.level && (
                <span className={`
                  shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase
                  ${levelColors ? `${levelColors.bg} ${levelColors.text}` : 'bg-gray-700 text-gray-300'}
                `}>
                  {log.level}
                </span>
              )}

              {/* HTTP 方法 */}
              {log.method && (
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getMethodColor(log.method)}`}>
                  {log.method}
                </span>
              )}

              {/* 状态码 */}
              {log.statusCode && (
                <span className={`shrink-0 font-semibold ${getStatusColor(log.statusCode)}`}>
                  {log.statusCode}
                </span>
              )}

              {/* 路径 */}
              {log.path && (
                <span className="text-cyan-400 shrink-0 max-w-[200px] truncate">
                  {log.path}
                </span>
              )}

              {/* 延迟 */}
              {log.latency && (
                <span className="text-yellow-500 shrink-0">
                  {log.latency}
                </span>
              )}

              {/* IP */}
              {log.ip && (
                <span className="text-purple-400 shrink-0">
                  {log.ip}
                </span>
              )}

              {/* 消息 */}
              <span className="text-gray-300 flex-1 break-all">
                {log.message}
              </span>

              {/* 复制按钮 */}
              <button
                onClick={() => onCopyLine?.(log.raw)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 
                  transition-all cursor-pointer shrink-0"
                title="复制"
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
