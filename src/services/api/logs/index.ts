/**
 * 日志相关 API
 */

import { apiClient } from '../client'

export interface LogEntry {
  timestamp?: string
  level?: string
  message?: string
  [key: string]: any
}

export interface RequestErrorLog {
  name: string
  size?: number
  modTime?: string
}

export interface LogsResponse {
  lines?: string[]
  logs?: string | LogEntry[]
  'line-count'?: number
  'latest-timestamp'?: number
}

export const logsApi = {
  // 获取日志，支持增量获取
  getLogs: (params?: { after?: number; limit?: number }) => 
    apiClient.get<LogsResponse>('/logs', params ? { params } : undefined),

  // 清除日志
  deleteLogs: () => apiClient.delete('/logs'),

  // 获取错误日志列表
  getRequestErrorLogs: () => 
    apiClient.get<{ files: RequestErrorLog[] }>('/request-error-logs'),

  // 下载错误日志文件
  downloadRequestErrorLog: (name: string) => 
    apiClient.getRaw(`/request-error-logs/${encodeURIComponent(name)}`),

  // 根据请求ID获取日志
  getRequestLogById: (id: string) => 
    apiClient.getRaw(`/request-log-by-id/${encodeURIComponent(id)}`)
}
