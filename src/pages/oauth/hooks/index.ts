/**
 * OAuth 页面 Hooks
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { oauthApi, type OAuthProvider, type KiroAuthMethod, type IFlowCookieResponse, type VertexImportResponse } from '@/services/api/oauth'

export interface ProviderState {
  url?: string
  state?: string
  status: 'idle' | 'waiting' | 'success' | 'error'
  error?: string
  polling: boolean
  projectId?: string
  authMethod?: KiroAuthMethod  // Kiro 认证方式
  callbackUrl?: string
  callbackSubmitting?: boolean
  callbackStatus?: 'success' | 'error'
  callbackError?: string
}

const initialState: ProviderState = {
  status: 'idle',
  polling: false
}

/**
 * OAuth 认证 Hook
 */
export function useOAuthProviders() {
  const [states, setStates] = useState<Record<OAuthProvider, ProviderState>>({} as any)
  const timers = useRef<Record<string, number>>({})

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(t => clearInterval(t))
    }
  }, [])

  const updateState = useCallback((provider: OAuthProvider, next: Partial<ProviderState>) => {
    setStates(prev => ({
      ...prev,
      [provider]: { ...(prev[provider] || initialState), ...next }
    }))
  }, [])

  const startPolling = useCallback((provider: OAuthProvider, state: string) => {
    if (timers.current[provider]) clearInterval(timers.current[provider])
    
    timers.current[provider] = window.setInterval(async () => {
      try {
        const res = await oauthApi.getAuthStatus(state)
        if (res.status === 'ok') {
          updateState(provider, { status: 'success', polling: false })
          clearInterval(timers.current[provider])
          delete timers.current[provider]
        } else if (res.status === 'error') {
          updateState(provider, { status: 'error', error: res.error, polling: false })
          clearInterval(timers.current[provider])
          delete timers.current[provider]
        }
      } catch (err: any) {
        updateState(provider, { status: 'error', error: err?.message, polling: false })
        clearInterval(timers.current[provider])
        delete timers.current[provider]
      }
    }, 3000)
  }, [updateState])

  const startAuth = useCallback(async (provider: OAuthProvider, authMethod?: KiroAuthMethod) => {
    const state = states[provider] || initialState
    const projectId = provider === 'gemini-cli' ? state.projectId?.trim() : undefined
    const method = provider === 'kiro' ? (authMethod || state.authMethod) : undefined

    if (provider === 'gemini-cli' && !projectId) {
      updateState(provider, { error: '请输入 Project ID' })
      return
    }

    if (provider === 'kiro' && !method) {
      updateState(provider, { error: '请选择认证方式' })
      return
    }

    updateState(provider, {
      status: 'waiting',
      polling: true,
      error: undefined,
      callbackStatus: undefined,
      callbackError: undefined,
      callbackUrl: ''
    })

    try {
      const res = await oauthApi.startAuth(provider, { projectId, method })
      updateState(provider, { url: res.url, state: res.state, status: 'waiting', polling: true })
      
      if (res.state) startPolling(provider, res.state)
    } catch (err: any) {
      updateState(provider, { status: 'error', error: err?.message, polling: false })
    }
  }, [states, updateState, startPolling])

  const submitCallback = useCallback(async (provider: OAuthProvider) => {
    const state = states[provider]
    const redirectUrl = state?.callbackUrl?.trim()
    if (!redirectUrl) return

    updateState(provider, { callbackSubmitting: true, callbackStatus: undefined, callbackError: undefined })

    try {
      await oauthApi.submitCallback(provider, redirectUrl)
      updateState(provider, { callbackSubmitting: false, callbackStatus: 'success' })
    } catch (err: any) {
      const errorMessage = err?.status === 404 
        ? '请更新 CLI Proxy API 或检查连接' 
        : err?.message
      updateState(provider, { callbackSubmitting: false, callbackStatus: 'error', callbackError: errorMessage })
    }
  }, [states, updateState])

  const setProjectId = useCallback((provider: OAuthProvider, projectId: string) => {
    updateState(provider, { projectId, error: undefined })
  }, [updateState])

  const setAuthMethod = useCallback((provider: OAuthProvider, authMethod: KiroAuthMethod) => {
    updateState(provider, { authMethod, error: undefined })
  }, [updateState])

  const setCallbackUrl = useCallback((provider: OAuthProvider, callbackUrl: string) => {
    updateState(provider, { callbackUrl, callbackStatus: undefined, callbackError: undefined })
  }, [updateState])

  const getState = useCallback((provider: OAuthProvider) => {
    return states[provider] || initialState
  }, [states])

  return { getState, startAuth, submitCallback, setProjectId, setAuthMethod, setCallbackUrl }
}

/**
 * iFlow Cookie 认证 Hook
 */
export function useIFlowCookie() {
  const [cookie, setCookie] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IFlowCookieResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    const trimmed = cookie.trim()
    if (!trimmed) {
      setError('请输入 Cookie')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await oauthApi.iflowCookieAuth(trimmed)
      if (res.status === 'ok') {
        setResult(res)
      } else {
        setError(res.error || '认证失败')
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setError('配置已存在')
      } else {
        setError(err?.message || '认证失败')
      }
    } finally {
      setLoading(false)
    }
  }, [cookie])

  return { cookie, setCookie, loading, result, error, submit }
}

/**
 * Vertex 导入 Hook
 */
export function useVertexImport() {
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VertexImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback((f: File | null) => {
    setFile(f)
    setError(null)
    setResult(null)
  }, [])

  const submit = useCallback(async () => {
    if (!file) {
      setError('请选择 JSON 文件')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await oauthApi.vertexImport(file, location.trim() || undefined)
      setResult(res)
    } catch (err: any) {
      setError(err?.message || '导入失败')
    } finally {
      setLoading(false)
    }
  }, [file, location])

  return { file, setFile: handleFileChange, location, setLocation, loading, result, error, submit }
}
