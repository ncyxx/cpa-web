/**
 * 日志页面
 * Bento Grid Style - Apple Design System
 * 模块化架构 - Feature-Sliced Design
 */

import { useState, useCallback } from 'react'
import { FileText } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { LogTabs, LogLevelFilter, LogToolbar, LogViewer, ErrorLogsList } from './components'
import { useLogs, useErrorLogs } from './hooks'
import type { LogTab } from './constants'

export function LogsPage() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const [activeTab, setActiveTab] = useState<LogTab>('logs')

  // 系统日志
  const {
    logs,
    loading,
    autoRefresh,
    setAutoRefresh,
    searchQuery,
    setSearchQuery,
    selectedLevel,
    setSelectedLevel,
    hideManagement,
    setHideManagement,
    fetchLogs,
    clearLogs,
    downloadLogs
  } = useLogs()

  // 错误日志
  const {
    errorLogs,
    loading: errorLoading,
    fetchErrorLogs,
    downloadErrorLog
  } = useErrorLogs()

  const disabled = connectionStatus !== 'connected'

  // 复制日志行
  const handleCopyLine = useCallback((line: string) => {
    navigator.clipboard.writeText(line)
  }, [])

  // 清除日志确认
  const handleClear = useCallback(async () => {
    if (!window.confirm('确定要清除所有日志吗？此操作不可恢复。')) return
    await clearLogs()
  }, [clearLogs])

  return (
    <div className="flex flex-col gap-4 -mt-8" style={{ height: 'calc(100vh - 180px)' }}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">系统日志</h1>
            <p className="text-xs text-gray-500">查看和管理系统运行日志</p>
          </div>
        </div>

        {/* Tab 切换 */}
        <LogTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-0">
        {activeTab === 'logs' ? (
          <>
            {/* 工具栏区域 */}
            <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
              {/* 日志级别过滤 */}
              <LogLevelFilter
                selectedLevel={selectedLevel}
                onLevelChange={setSelectedLevel}
              />

              {/* 工具栏 */}
              <LogToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                hideManagement={hideManagement}
                onHideManagementChange={setHideManagement}
                onRefresh={() => fetchLogs(false)}
                onDownload={downloadLogs}
                onClear={handleClear}
                loading={loading}
                disabled={disabled}
                logsCount={logs.length}
              />
            </div>

            {/* 日志查看器 */}
            <div className="flex-1 p-4 overflow-hidden">
              <LogViewer
                logs={logs}
                loading={loading}
                onCopyLine={handleCopyLine}
              />
            </div>
          </>
        ) : (
          /* 错误日志列表 */
          <div className="flex-1 p-4 overflow-hidden">
            <ErrorLogsList
              logs={errorLogs}
              loading={errorLoading}
              onDownload={downloadErrorLog}
              onRefresh={fetchErrorLogs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
