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

  importUsage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file, file.name)
    return apiClient.postForm('/usage/import', formData)
  }
}
