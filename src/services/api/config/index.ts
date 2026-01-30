/**
 * 配置相关 API
 */

import { apiClient } from '../client'

export interface Config {
  debug?: boolean
  'commercial-mode'?: boolean
  'usage-statistics-enabled'?: boolean
  'logging-to-file'?: boolean
  'logs-max-total-size-mb'?: number
  'request-log'?: boolean
  'ws-auth'?: boolean
  'request-retry'?: number
  'max-retry-interval'?: number
  'disable-cooling'?: boolean
  'proxy-url'?: string
  'incognito-browser'?: boolean
  'kiro-preferred-endpoint'?: string
  'api-keys'?: string[]
  'gemini-api-key'?: any[]
  'claude-api-key'?: any[]
  'codex-api-key'?: any[]
  'openai-compatibility'?: any[]
  'vertex-api-key'?: any[]
  kiro?: any[]
  'quota-exceeded'?: {
    'switch-project'?: boolean
    'switch-preview-model'?: boolean
  }
  routing?: {
    strategy?: string
  }
  'health-check'?: {
    enabled?: boolean
    'check-interval'?: string
    'refresh-before-expiry'?: string
    'refresh-batch-size'?: number
  }
  'prompt-cache'?: {
    enabled?: boolean
    'min-tokens'?: number
    'max-cache-blocks'?: number
  }
  'extended-thinking'?: {
    enabled?: boolean
    'default-budget-tokens'?: number
  }
  pool?: {
    enabled?: boolean
    providers?: Record<string, {
      'target-count'?: number
      'replenish-threshold'?: number
      'low-quota-threshold'?: number
      concurrency?: number
      'batch-size'?: number
    }>
  }
  transit?: {
    enabled?: boolean
    port?: number
  }
  tls?: {
    enable?: boolean
    'cert-file'?: string
    'key-file'?: string
  }
  payload?: {
    default?: any[]
    override?: any[]
  }
  [key: string]: any
}

export const configApi = {
  getConfig: () => apiClient.get<Config>('/config'),
  getConfigYAML: () => apiClient.getRaw('/config.yaml').then(res => res.data),
  putConfigYAML: (yaml: string) => apiClient.put('/config.yaml', yaml, {
    headers: { 'Content-Type': 'application/yaml' }
  }),
  getLatestVersion: () => apiClient.get<{ 'latest-version': string }>('/latest-version'),

  // Panel update
  triggerPanelUpdate: () => apiClient.post<{
    message: string
    current_version: string
    latest_version: string
    updated: boolean
    error?: string
  }>('/panel/update'),

  getDebug: () => apiClient.get<{ debug: boolean }>('/debug'),
  putDebug: (value: boolean) => apiClient.put('/debug', { value }),

  getUsageStatisticsEnabled: () => apiClient.get<{ 'usage-statistics-enabled': boolean }>('/usage-statistics-enabled'),
  putUsageStatisticsEnabled: (value: boolean) => apiClient.put('/usage-statistics-enabled', { value }),

  getLoggingToFile: () => apiClient.get<{ 'logging-to-file': boolean }>('/logging-to-file'),
  putLoggingToFile: (value: boolean) => apiClient.put('/logging-to-file', { value }),

  getRequestLog: () => apiClient.get<{ 'request-log': boolean }>('/request-log'),
  putRequestLog: (value: boolean) => apiClient.put('/request-log', { value }),

  getWsAuth: () => apiClient.get<{ 'ws-auth': boolean }>('/ws-auth'),
  putWsAuth: (value: boolean) => apiClient.put('/ws-auth', { value }),

  getRequestRetry: () => apiClient.get<{ 'request-retry': number }>('/request-retry'),
  putRequestRetry: (value: number) => apiClient.put('/request-retry', { value }),

  getMaxRetryInterval: () => apiClient.get<{ 'max-retry-interval': number }>('/max-retry-interval'),
  putMaxRetryInterval: (value: number) => apiClient.put('/max-retry-interval', { value }),

  getProxyUrl: () => apiClient.get<{ 'proxy-url': string }>('/proxy-url'),
  putProxyUrl: (value: string) => apiClient.put('/proxy-url', { value }),
  deleteProxyUrl: () => apiClient.delete('/proxy-url'),

  getSwitchProject: () => apiClient.get<{ 'switch-project': boolean }>('/quota-exceeded/switch-project'),
  putSwitchProject: (value: boolean) => apiClient.put('/quota-exceeded/switch-project', { value }),
  getSwitchPreviewModel: () => apiClient.get<{ 'switch-preview-model': boolean }>('/quota-exceeded/switch-preview-model'),
  putSwitchPreviewModel: (value: boolean) => apiClient.put('/quota-exceeded/switch-preview-model', { value }),
}
