/**
 * 配置状态管理
 * 
 * 安全优化：不持久化敏感配置数据到 localStorage
 * 通过 ProtectedRoute 预加载数据避免闪烁
 */

import { create } from 'zustand'
import { configApi, type Config } from '@/services/api/config'

const CACHE_EXPIRY_MS = 30000 // 30 seconds

interface ConfigState {
  config: Config | null
  loading: boolean
  error: string | null
  lastFetchTime: number | null

  fetchConfig: (forceRefresh?: boolean) => Promise<Config>
  updateConfigValue: (key: keyof Config, value: any) => void
  clearCache: () => void
}

let configRequestToken = 0
let inFlightConfigRequest: { id: number; promise: Promise<Config> } | null = null

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,
  lastFetchTime: null,

  fetchConfig: async (forceRefresh = false) => {
    const { config, lastFetchTime } = get()

    // 如果有缓存的 config 且未过期，直接返回
    if (!forceRefresh && config && lastFetchTime) {
      const isValid = Date.now() - lastFetchTime < CACHE_EXPIRY_MS
      if (isValid) {
        return config
      }
    }

    // 合并并发请求
    if (inFlightConfigRequest) {
      return inFlightConfigRequest.promise
    }

    set({ loading: true, error: null })

    const requestId = (configRequestToken += 1)
    try {
      const requestPromise = configApi.getConfig()
      inFlightConfigRequest = { id: requestId, promise: requestPromise }
      const data = await requestPromise
      const now = Date.now()

      if (requestId !== configRequestToken) {
        return data
      }

      set({
        config: data,
        lastFetchTime: now,
        loading: false
      })

      return data
    } catch (error: any) {
      if (requestId === configRequestToken) {
        set({
          error: error.message || 'Failed to fetch config',
          loading: false
        })
      }
      throw error
    } finally {
      if (inFlightConfigRequest?.id === requestId) {
        inFlightConfigRequest = null
      }
    }
  },

  updateConfigValue: (key: keyof Config, value: any) => {
    const { config } = get()
    if (!config) return

    set({
      config: {
        ...config,
        [key]: value
      }
    })
  },

  clearCache: () => {
    configRequestToken += 1
    inFlightConfigRequest = null
    set({ config: null, lastFetchTime: null, loading: false, error: null })
  }
}))
