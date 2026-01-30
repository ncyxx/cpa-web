/**
 * 系统相关 API
 */

import { apiClient } from '../client'

export interface AuthHealthItem {
  auth_id: string
  provider: string
  status: string
  expires_at?: string
  last_checked?: string
  last_refreshed?: string
  error_message?: string
  next_check_after?: string
}

export interface HealthCheckResponse {
  health_checks: AuthHealthItem[]
  total: number
}

export interface PoolStatus {
  provider: string
  target_count: number
  current_count: number
  healthy_count: number
  low_quota_count: number
  exhausted_count: number
  banned_count: number
  expired_count: number
  total_usage: number
  total_limit: number
  available_quota: number
}

export interface PoolConfig {
  enabled?: boolean
  syncInterval?: number
  [key: string]: any
}

export interface TransitStatus {
  running: boolean
  port?: number
  [key: string]: any
}

export const systemApi = {
  getHealthStatus: () => apiClient.get<HealthCheckResponse>('/health-check'),
  getAuthHealth: (id: string) => apiClient.get<AuthHealthItem>(`/health-check/${encodeURIComponent(id)}`),
  triggerHealthCheck: () => apiClient.post('/health-check/trigger'),

  getAllPoolStatus: () => apiClient.get<{ status: Record<string, PoolStatus> }>('/pool/status'),
  getProviderPoolStatus: (provider: string) => 
    apiClient.get<PoolStatus>(`/pool/status/${encodeURIComponent(provider)}`),
  getProviderAccounts: (provider: string) => 
    apiClient.get(`/pool/accounts/${encodeURIComponent(provider)}`),
  triggerPoolSync: () => apiClient.post('/pool/sync'),
  getPoolConfig: () => apiClient.get<PoolConfig>('/pool/config'),
  updatePoolConfig: (config: PoolConfig) => apiClient.put('/pool/config', config),

  getTransitStatus: () => apiClient.get<TransitStatus>('/transit/status'),
  startTransitServer: () => apiClient.post('/transit/start'),
  stopTransitServer: () => apiClient.post('/transit/stop'),

  importVertexCredential: (file: File) => {
    const formData = new FormData()
    formData.append('file', file, file.name)
    return apiClient.postForm('/vertex/import', formData)
  }
}
