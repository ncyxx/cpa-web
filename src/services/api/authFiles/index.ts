/**
 * 认证文件相关 API
 */

import { apiClient } from '../client'

export interface AuthFile {
  id?: string
  name: string
  provider?: string
  type?: string
  label?: string
  size?: number
  modTime?: string | number
  modtime?: string | number
  email?: string
  account?: string
  account_type?: string
  accountId?: string
  account_id?: string
  auth_index?: number
  models?: string[]
  status?: string
  status_message?: string
  disabled?: boolean
  unavailable?: boolean
  runtime_only?: boolean
  source?: string
  path?: string
  // Stats
  success_count?: number
  failure_count?: number
  success_rate?: number
  stats_updated?: string
  // Timestamps
  created_at?: string
  updated_at?: string
  last_refresh?: string
  next_retry_after?: string
  id_token?: Record<string, unknown>
  // Metadata
  metadata?: Record<string, unknown>
}

export interface AuthFilesResponse {
  files: AuthFile[]
}

const normalizeAuthFile = (file: any): AuthFile => {
  if (!file || typeof file !== 'object') {
    return { name: '' }
  }

  const accountValue = file.accountId ?? file.account_id ?? file.account
  const accountText = accountValue !== undefined && accountValue !== null
    ? String(accountValue).trim()
    : ''
  const modTimeValue = file.modTime ?? file.modtime

  return {
    ...file,
    modTime: modTimeValue,
    modtime: modTimeValue,
    account: accountText || undefined,
    accountId: accountText || undefined,
    account_id: accountText || undefined
  }
}

export const authFilesApi = {
  list: async () => {
    const data = await apiClient.get<AuthFilesResponse>('/auth-files')
    const files = Array.isArray(data?.files) ? data.files : []
    return {
      ...data,
      files: files.map((file) => normalizeAuthFile(file))
    }
  },

  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file, file.name)
    return apiClient.postForm('/auth-files', formData)
  },

  deleteFile: (name: string) => apiClient.delete(`/auth-files?name=${encodeURIComponent(name)}`),

  deleteAll: () => apiClient.delete('/auth-files', { params: { all: true } }),

  download: (name: string) => apiClient.getRaw(`/auth-files/download?name=${encodeURIComponent(name)}`),

  setDisabled: (name: string, disabled: boolean) =>
    apiClient.patch('/auth-files/status', { name, disabled }),

  async getModels(name: string): Promise<{ id: string; display_name?: string; type?: string; owned_by?: string }[]> {
    const data = await apiClient.get(`/auth-files/models?name=${encodeURIComponent(name)}`)
    return (data && Array.isArray(data['models'])) ? data['models'] : []
  },

  async getOauthExcludedModels(): Promise<Record<string, string[]>> {
    const data = await apiClient.get('/oauth-excluded-models')
    const payload = (data && (data['oauth-excluded-models'] ?? data.items ?? data)) as any
    return payload && typeof payload === 'object' ? payload : {}
  },

  saveOauthExcludedModels: (provider: string, models: string[]) =>
    apiClient.patch('/oauth-excluded-models', { provider, models }),

  deleteOauthExcludedEntry: (provider: string) =>
    apiClient.delete(`/oauth-excluded-models?provider=${encodeURIComponent(provider)}`)
}
