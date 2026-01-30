import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import axios from 'axios'
import { apiClient } from '@/services/api'

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
  connectionStatus: ConnectionStatus
  connectionError: string | null
  useCustomBase: boolean

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<boolean>
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

let restoreSessionPromise: Promise<boolean> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      apiBase: '',
      managementKey: '',
      serverVersion: null,
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
              return false
            }
          }

          return false
        })()

        return restoreSessionPromise
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

          const version = response.headers['x-cpa-version'] || response.headers['x-server-version'] || null

          // 配置 API 客户端
          apiClient.setConfig({ apiBase, managementKey })

          set({
            isAuthenticated: true,
            apiBase,
            managementKey,
            serverVersion: version,
            connectionStatus: 'connected',
            connectionError: null
          })
          localStorage.setItem('cli-proxy-logged-in', 'true')
        } catch (error: any) {
          const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Connection failed'
          set({
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
        useCustomBase: state.useCustomBase
      })
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('unauthorized', () => {
    useAuthStore.getState().logout()
  })
}
