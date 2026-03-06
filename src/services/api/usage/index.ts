/**
 * 使用统计相关 API
 */

import { apiClient } from '../client'

export interface ModelSnapshot {
  total_requests: number
  total_tokens: number
  details?: any[]
}

export interface APISnapshot {
  total_requests: number
  total_tokens: number
  models?: Record<string, ModelSnapshot>
}

export interface UsageStatistics {
  total_requests: number
  success_count: number
  failure_count: number
  total_tokens: number
  apis?: Record<string, APISnapshot>
  requests_by_day?: Record<string, number>
  requests_by_hour?: Record<string, number>
  tokens_by_day?: Record<string, number>
  tokens_by_hour?: Record<string, number>
}

export interface UsageResponse {
  usage: UsageStatistics
  failed_requests: number
}

export const usageApi = {
  getUsage: () => apiClient.get<UsageResponse>('/usage'),

  exportUsage: () => apiClient.getRaw('/usage/export'),

  importUsage: async (file: File) => {
    const text = await file.text()
    let payload: any

    try {
      payload = JSON.parse(text)
    } catch {
      throw new Error('导入文件不是有效的 JSON')
    }

    return apiClient.post('/usage/import', payload)
  }
}
