import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'
import { apiClient } from '@/services/api'
import { apiCallApi } from '@/services/api/apiCall'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface LoginCredentials {
  apiBase: string
  managementKey: string
}

export interface AuthState {
  isAuthenticated: boolean
  apiBase: string
  managementKey: string
  serverVersion: string | null
  serverBuildDate: string | null
  connectionStatus: ConnectionStatus
  connectionError: string | null
  useCustomBase: boolean

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<boolean>
  refreshServerVersion: () => Promise<string | null>
  updateConnectionStatus: (status: ConnectionStatus, error?: string | null) => void
  setUseCustomBase: (useCustom: boolean) => void
}

const normalizeApiBase = (input: string): string => {
  let base = (input || '').trim()
  if (!base) return ''
  base = base.replace(/\/?v0\/management\/?$/i, '')
  base = base.replace(/\/+$/i, '')
  if (!/^https?:\/\//i.test(base)) {
    base = `http://${base}`
  }
  return base
}

const MANAGEMENT_API_PREFIX = '/v0/management'
const VERSION_HEADER_KEYS = ['x-cpa-version', 'x-server-version', 'x-cli-proxy-version']
const BUILD_DATE_HEADER_KEYS = ['x-cpa-build-date', 'x-build-date', 'date']

const pickHeaderValue = (
  headers: Record<string, string[] | string> | undefined,
  keys: string[],
  ignored: string[] = []
): string | null => {
  if (!headers || typeof headers !== 'object') return null
  const ignoredSet = new Set(ignored.map((item) => item.toLowerCase()))

  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value])
  )

  for (const key of keys) {
    const raw = normalized[key]
    if (Array.isArray(raw)) {
      const found = raw.find((item) => {
        const value = String(item || '').trim()
        return value && !ignoredSet.has(value.toLowerCase())
      })
      if (found) return String(found).trim()
      continue
    }
    if (raw !== undefined && raw !== null) {
      const value = String(raw).trim()
      if (value && !ignoredSet.has(value.toLowerCase())) return value
    }
  }
  return null
}

const pickVersionFromHeaderMap = (headers?: Record<string, string[] | string>): string | null =>
  pickHeaderValue(headers, VERSION_HEADER_KEYS)

const pickBuildDateFromHeaderMap = (headers?: Record<string, string[] | string>): string | null =>
  pickHeaderValue(headers, BUILD_DATE_HEADER_KEYS, ['unknown', 'none', 'null', '-'])

let restoreSessionPromise: Promise<boolean> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      apiBase: '',
      managementKey: '',
      serverVersion: null,
      serverBuildDate: null,
      connectionStatus: 'disconnected',
      connectionError: null,
      useCustomBase: false,

      restoreSession: () => {
        if (restoreSessionPromise) return restoreSessionPromise

        restoreSessionPromise = (async () => {
          const wasLoggedIn = localStorage.getItem('cli-proxy-logged-in') === 'true'
          const { apiBase, managementKey } = get()

          if (wasLoggedIn && apiBase && managementKey) {
            try {
              await get().login({ apiBase, managementKey })
              return true
            } catch (error) {
              console.warn('Auto login failed:', error)
              const message =
                error instanceof Error
                  ? error.message
                  : 'Auto login failed'
              localStorage.removeItem('cli-proxy-logged-in')
              set({
                isAuthenticated: false,
                serverVersion: null,
                serverBuildDate: null,
                connectionStatus: 'error',
                connectionError: message
              })
              return false
            }
          }

          return false
        })().finally(() => {
          restoreSessionPromise = null
        })

        return restoreSessionPromise
      },

      refreshServerVersion: async () => {
        const { isAuthenticated, apiBase, managementKey, serverVersion } = get()
        if (!isAuthenticated || !apiBase || !managementKey) return serverVersion

        try {
          const result = await apiCallApi.request({
            method: 'GET',
            url: `${apiBase}${MANAGEMENT_API_PREFIX}/config`,
            header: {
              Authorization: `Bearer ${managementKey}`
            }
          })

          const latest = pickVersionFromHeaderMap(result.header)
          const latestBuildDate = pickBuildDateFromHeaderMap(result.header)
          if (
            (latest && latest !== get().serverVersion) ||
            (latestBuildDate && latestBuildDate !== get().serverBuildDate)
          ) {
            set({
              serverVersion: latest || get().serverVersion,
              serverBuildDate: latestBuildDate || get().serverBuildDate
            })
          }
          return latest || get().serverVersion
        } catch {
          return get().serverVersion
        }
      },

      login: async (credentials) => {
        const apiBase = normalizeApiBase(credentials.apiBase)
        const managementKey = credentials.managementKey.trim()

        try {
          set({ connectionStatus: 'connecting' })

          const response = await axios.get(`${apiBase}${MANAGEMENT_API_PREFIX}/config`, {
            headers: {
              Authorization: `Bearer ${managementKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          })

          const contentType = String(response.headers?.['content-type'] || '').toLowerCase()
          const looksLikeJson = contentType.includes('application/json')
          const isObjectPayload =
            response.data !== null &&
            typeof response.data === 'object' &&
            !Array.isArray(response.data)

          // Avoid false-positive login when accidentally pointing to frontend dev server.
          if (!looksLikeJson || !isObjectPayload) {
            throw new Error('连接地址不是 CLIProxyAPI 后端，请改为 http://127.0.0.1:8317')
          }

          const version = response.headers['x-cpa-version'] || response.headers['x-server-version'] || null
          const buildDate = response.headers['x-cpa-build-date'] || response.headers['x-build-date'] || null

          // 配置 API 客户端
          apiClient.setConfig({ apiBase, managementKey })

          set({
            isAuthenticated: true,
            apiBase,
            managementKey,
            serverVersion: version,
            serverBuildDate: buildDate,
            connectionStatus: 'connected',
            connectionError: null
          })
          localStorage.setItem('cli-proxy-logged-in', 'true')
          void get().refreshServerVersion()
        } catch (error: any) {
          const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Connection failed'
          localStorage.removeItem('cli-proxy-logged-in')
          set({
            isAuthenticated: false,
            serverVersion: null,
            serverBuildDate: null,
            connectionStatus: 'error',
            connectionError: message
          })
          throw new Error(message)
        }
      },

      logout: () => {
        const { apiBase, useCustomBase } = get()
        restoreSessionPromise = null
        set({
          isAuthenticated: false,
          // 保留 apiBase 和 useCustomBase，只清除认证状态
          apiBase: apiBase,
          managementKey: '',
          serverVersion: null,
          serverBuildDate: null,
          connectionStatus: 'disconnected',
          connectionError: null,
          useCustomBase: useCustomBase
        })
        localStorage.removeItem('cli-proxy-logged-in')
      },

      updateConnectionStatus: (status, error = null) => {
        set({
          connectionStatus: status,
          connectionError: error
        })
      },

      setUseCustomBase: (useCustom) => {
        set({ useCustomBase: useCustom })
      }
    }),
    {
      name: 'cli-proxy-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        apiBase: state.apiBase,
        managementKey: state.managementKey,
        serverVersion: state.serverVersion,
        serverBuildDate: state.serverBuildDate,
        useCustomBase: state.useCustomBase
      })
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('server-version-update', (event: Event) => {
    const current = useAuthStore.getState()
    if (!current.isAuthenticated) return

    const detail = (event as CustomEvent<{ version?: string | null; buildDate?: string | null }>).detail
    const nextVersion = typeof detail?.version === 'string' ? detail.version.trim() : ''
    const nextBuildDate = typeof detail?.buildDate === 'string' ? detail.buildDate.trim() : ''

    if (
      (!nextVersion || nextVersion === current.serverVersion) &&
      (!nextBuildDate || nextBuildDate === current.serverBuildDate)
    ) {
      return
    }

    useAuthStore.setState({
      serverVersion: nextVersion || current.serverVersion,
      serverBuildDate: nextBuildDate || current.serverBuildDate
    })
  })

  window.addEventListener('unauthorized', () => {
    useAuthStore.getState().logout()
  })
}
