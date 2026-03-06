/**
 * OAuth 相关 API
 */

import { apiClient } from '../client'

export type OAuthProvider = 'codex' | 'anthropic' | 'antigravity' | 'gemini-cli' | 'qwen' | 'iflow'

export interface OAuthUrlResponse {
  url: string
  state?: string
}

export interface AuthStatusResponse {
  status: 'ok' | 'wait' | 'error'
  error?: string
}

export interface IFlowCookieResponse {
  status: 'ok' | 'error'
  error?: string
  saved_path?: string
  email?: string
  expired?: string
  type?: string
}

export interface VertexImportResponse {
  project_id?: string
  email?: string
  location?: string
  'auth-file'?: string
  auth_file?: string
}

const WEBUI_SUPPORTED: OAuthProvider[] = ['codex', 'anthropic', 'antigravity', 'gemini-cli', 'iflow']

export const oauthApi = {
  // 获取 OAuth 登录 URL
  startAuth: (provider: OAuthProvider, options?: { projectId?: string }) => {
    const params: Record<string, string | boolean> = {}
    if (WEBUI_SUPPORTED.includes(provider)) {
      params.is_webui = true
    }
    if (provider === 'gemini-cli' && options?.projectId) {
      params.project_id = options.projectId
    }
    return apiClient.get<OAuthUrlResponse>(`/${provider}-auth-url`, {
      params: Object.keys(params).length ? params : undefined
    })
  },

  // 获取认证状态
  getAuthStatus: (state: string) =>
    apiClient.get<AuthStatusResponse>('/get-auth-status', { params: { state } }),

  // iFlow Cookie 认证
  iflowCookieAuth: (cookie: string) =>
    apiClient.post<IFlowCookieResponse>('/iflow-auth-url', { cookie }),

  // Vertex JSON 导入
  vertexImport: (file: File, location?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (location) {
      formData.append('location', location)
    }
    return apiClient.postForm<VertexImportResponse>('/vertex/import', formData)
  }
}
