/**
 * 日志页面 Hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { logsApi } from '@/services/api'
import { useAuthStore } from '@/stores'
import { AUTO_REFRESH_INTERVAL, MANAGEMENT_API_PREFIX } from '../constants'
import type { LogLevel } from '../constants'

export interface ParsedLogLine {
  raw: string
  timestamp?: string
  level?: string
  message: string
  requestId?: string
  method?: string
  path?: string
  statusCode?: number
  latency?: string
  ip?: string
}

export interface ErrorLogFile {
  name: string
  size?: number
  modTime?: string
}

// 日志级别正则
const LOG_LEVEL_REGEX = /\b(trace|debug|info|warn|warning|error|fatal)\b/i
const LOG_TIMESTAMP_REGEX = /^\[?(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)\]?/
const HTTP_METHOD_REGEX = /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/
const HTTP_STATUS_REGEX = /\|\s*(\d{3})\s*\|/

// 解析日志行
const parseLogLine = (raw: string): ParsedLogLine => {
  let remaining = raw.trim()
  let timestamp: string | undefined
  let level: string | undefined
  let requestId: string | undefined
  let method: string | undefined
  let path: string | undefined
  let statusCode: number | undefined
  let latency: string | undefined
  let ip: string | undefined

  // 提取时间戳
  const tsMatch = remaining.match(LOG_TIMESTAMP_REGEX)
  if (tsMatch) {
    timestamp = tsMatch[1]
    remaining = remaining.slice(tsMatch[0].length).trim()
  }

  // 提取请求ID
  const reqIdMatch = remaining.match(/^\[([a-f0-9]{8})\]\s*/i)
  if (reqIdMatch) {
    requestId = reqIdMatch[1]
    remaining = remaining.slice(reqIdMatch[0].length).trim()
  }

  // 提取日志级别
  const lvlMatch = remaining.match(LOG_LEVEL_REGEX)
  if (lvlMatch) {
    level = lvlMatch[1].toLowerCase()
    if (level === 'warning') level = 'warn'
  }

  // 提取 HTTP 方法
  const methodMatch = remaining.match(HTTP_METHOD_REGEX)
  if (methodMatch) {
    method = methodMatch[1]
    const afterMethod = remaining.slice((methodMatch.index || 0) + methodMatch[0].length).trim()
    const pathMatch = afterMethod.match(/^(\S+)/)
    if (pathMatch) path = pathMatch[1]
  }

  // 提取状态码
  const statusMatch = remaining.match(HTTP_STATUS_REGEX)
  if (statusMatch) {
    statusCode = parseInt(statusMatch[1], 10)
  }

  // 提取延迟
  const latencyMatch = remaining.match(/\b(\d+(?:\.\d+)?)\s*(µs|us|ms|s)\b/i)
  if (latencyMatch) {
    latency = `${latencyMatch[1]}${latencyMatch[2]}`
  }

  // 提取 IP
  const ipMatch = remaining.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
  if (ipMatch) {
    ip = ipMatch[0]
  }

  return {
    raw,
    timestamp,
    level,
    message: remaining,
    requestId,
    method,
    path,
    statusCode,
    latency,
    ip
  }
}

// 推断日志级别
const inferLogLevel = (line: string): string | undefined => {
  const lowered = line.toLowerCase()
  if (/\bfatal\b/.test(lowered)) return 'fatal'
  if (/\berror\b/.test(lowered)) return 'error'
  if (/\bwarn(?:ing)?\b/.test(lowered)) return 'warn'
  if (/\binfo\b/.test(lowered)) return 'info'
  if (/\bdebug\b/.test(lowered)) return 'debug'
  if (/\btrace\b/.test(lowered)) return 'trace'
  return undefined
}

export function useLogs() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>('all')
  const [hideManagement, setHideManagement] = useState(true)
  const latestTimestampRef = useRef<number>(0)

  const fetchLogs = useCallback(async (incremental = false) => {
    if (connectionStatus !== 'connected') return

    if (!incremental) setLoading(true)
    setError(null)

    try {
      const params: { after?: number; limit?: number } = { limit: 500 }
      if (incremental && latestTimestampRef.current > 0) {
        params.after = latestTimestampRef.current
      }
      const response = await logsApi.getLogs(params)
      
      console.log('[Logs] API Response:', response)
      
      // 处理响应数据 - 后端返回 { lines: string[], 'line-count': number, 'latest-timestamp': number }
      let newLines: string[] = []
      if (response) {
        // 优先使用 lines 字段
        if (Array.isArray(response.lines)) {
          newLines = response.lines
        } else if (response.logs) {
          // 兼容旧格式
          const logsData = response.logs
          if (Array.isArray(logsData)) {
            newLines = logsData.map((l: any) => typeof l === 'string' ? l : JSON.stringify(l))
          } else if (typeof logsData === 'string') {
            newLines = logsData.split('\n').filter(Boolean)
          }
        }
        
        // 更新时间戳
        if (response['latest-timestamp']) {
          latestTimestampRef.current = response['latest-timestamp']
        }
      }

      if (incremental && newLines.length > 0) {
        setLogs(prev => [...prev, ...newLines].slice(-500)) // 限制500条
      } else if (!incremental) {
        setLogs(newLines.slice(-500)) // 限制500条
      }
    } catch (err: any) {
      setError(err.message || '加载日志失败')
    } finally {
      if (!incremental) setLoading(false)
    }
  }, [connectionStatus])

  const clearLogs = useCallback(async () => {
    try {
      await logsApi.deleteLogs()
      setLogs([])
      latestTimestampRef.current = 0
      return true
    } catch (err: any) {
      setError(err.message || '清除日志失败')
      return false
    }
  }, [])

  const downloadLogs = useCallback(() => {
    const text = logs.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [logs])

  // 初始加载
  useEffect(() => {
    if (connectionStatus === 'connected') {
      latestTimestampRef.current = 0
      fetchLogs(false)
    }
  }, [connectionStatus, fetchLogs])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || connectionStatus !== 'connected') return
    const id = setInterval(() => fetchLogs(true), AUTO_REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [autoRefresh, connectionStatus, fetchLogs])

  // 解析和过滤日志
  const filteredLogs = useMemo(() => {
    let result = logs

    // 隐藏管理日志
    if (hideManagement) {
      result = result.filter(line => !line.includes(MANAGEMENT_API_PREFIX))
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(line => line.toLowerCase().includes(query))
    }

    // 级别过滤
    if (selectedLevel !== 'all') {
      result = result.filter(line => {
        const level = inferLogLevel(line)
        return level === selectedLevel
      })
    }

    return result.map(parseLogLine)
  }, [logs, hideManagement, searchQuery, selectedLevel])

  return {
    logs: filteredLogs,
    rawLogs: logs,
    loading,
    error,
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
  }
}

export function useErrorLogs() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const [errorLogs, setErrorLogs] = useState<ErrorLogFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchErrorLogs = useCallback(async () => {
    if (connectionStatus !== 'connected') return

    setLoading(true)
    setError(null)

    try {
      const response = await logsApi.getRequestErrorLogs()
      setErrorLogs(response?.files || [])
    } catch (err: any) {
      setError(err.message || '加载错误日志失败')
      setErrorLogs([])
    } finally {
      setLoading(false)
    }
  }, [connectionStatus])

  const downloadErrorLog = useCallback(async (name: string) => {
    try {
      const response = await logsApi.downloadRequestErrorLog(name)
      const blob = new Blob([response.data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch (err: any) {
      setError(err.message || '下载失败')
      return false
    }
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchErrorLogs()
    }
  }, [connectionStatus, fetchErrorLogs])

  return {
    errorLogs,
    loading,
    error,
    fetchErrorLogs,
    downloadErrorLog
  }
}
