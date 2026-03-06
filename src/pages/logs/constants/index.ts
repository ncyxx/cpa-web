/**
 * 日志页面常量
 */

// 日志级别配置
export const LOG_LEVELS = [
  { key: 'all', label: '全部', color: 'gray' },
  { key: 'trace', label: 'Trace', color: 'slate' },
  { key: 'debug', label: 'Debug', color: 'blue' },
  { key: 'info', label: 'Info', color: 'green' },
  { key: 'warn', label: 'Warn', color: 'amber' },
  { key: 'error', label: 'Error', color: 'red' },
  { key: 'fatal', label: 'Fatal', color: 'rose' }
] as const

export type LogLevel = typeof LOG_LEVELS[number]['key']

// 日志级别颜色映射
export const LOG_LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  trace: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  debug: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  info: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  warn: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  error: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  fatal: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' }
}

// Tab 配置
export const LOG_TABS = [
  { key: 'logs', label: '系统日志', icon: 'FileText' },
  { key: 'errors', label: '错误日志', icon: 'AlertCircle' }
] as const

export type LogTab = typeof LOG_TABS[number]['key']

// 自动刷新间隔 (ms)
export const AUTO_REFRESH_INTERVAL = 5000

// 最大显示行数
export const MAX_DISPLAY_LINES = 500

// 管理 API 前缀 (用于过滤)
export const MANAGEMENT_API_PREFIX = '/v0/management'
