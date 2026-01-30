/**
 * Kiro Provider API Module
 * Handles AWS CodeWhisperer token management
 */

import { apiClient } from '../../client'

export interface KiroToken {
  id: string
  name?: string
  email?: string
  provider?: string
  auth_method?: string
  profile_arn?: string
  status?: string
  status_message?: string
  expires_at?: string
  is_expired?: boolean
  last_refresh?: string
  // Quota info
  current_usage?: number
  usage_limit?: number
  subscription_title?: string
  next_reset?: string
  quota_updated_at?: string
  // Stats
  success_count?: number
  failure_count?: number
  success_rate?: number
  stats_updated?: string
  // Timestamps
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface KiroTokensResponse {
  tokens: KiroToken[]
  total: number
}

export interface KiroQuotaResponse {
  quotas: Array<{
    name: string
    email?: string
    provider?: string
    status: string
    error_message?: string
    current_usage?: number
    usage_limit?: number
    subscription_title?: string
    next_reset?: string
  }>
  total: number
}

export interface KiroHealthCheckResult {
  id: string
  status: 'healthy' | 'unhealthy' | 'error'
  message?: string
  quota?: {
    used?: number
    total?: number
    remaining?: number
  }
}

export const kiroProviderApi = {
  importToken: (token: string) => apiClient.post('/kiro/import', { token }),

  batchImportTokens: (tokens: string[]) => apiClient.post('/kiro/batch-import', { tokens }),

  listTokens: () => apiClient.get<KiroTokensResponse>('/kiro/tokens'),

  deleteToken: (id: string) => apiClient.delete(`/kiro/tokens?id=${encodeURIComponent(id)}`),

  checkTokenHealth: (id: string) =>
    apiClient.post<KiroHealthCheckResult>('/kiro/tokens/check', { id }),

  checkAllTokensHealth: () =>
    apiClient.post<{ results: KiroHealthCheckResult[] }>('/kiro/tokens/check-all'),

  getTokensQuota: () => apiClient.get<KiroQuotaResponse>('/kiro/tokens/quota'),

  trashTokens: (ids: string[]) => apiClient.post('/kiro/tokens/trash', { ids }),

  getTrashedTokens: () => apiClient.get<KiroTokensResponse>('/kiro/tokens/trash'),

  restoreTokens: (ids: string[]) => apiClient.post('/kiro/tokens/restore', { ids }),

  deleteTrashedTokens: (ids: string[]) => apiClient.delete('/kiro/tokens/trash', { data: { ids } }),

  trashExhaustedTokens: () => apiClient.post('/kiro/tokens/trash-exhausted')
}
