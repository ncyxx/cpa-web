/**
 * AI 提供商数据 Hook
 * 使用 Zustand store 缓存数据，避免刷新闪屏
 */

import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useAuthStore, useConfigStore } from '@/stores'

interface AIProvidersState {
  loading: boolean
  refreshing: boolean
  initialized: boolean
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useAIProvidersStore = create<AIProvidersState>((set) => ({
  loading: true,
  refreshing: false,
  initialized: false,
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInitialized: (initialized) => set({ initialized }),
}))

let isLoading = false

export async function preloadAIProvidersData(fetchConfig: () => Promise<any>, isRefresh = false) {
  const store = useAIProvidersStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  
  if (isRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }
  
  try {
    await fetchConfig()
    store.setInitialized(true)
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
    isLoading = false
  }
}

export function useAIProvidersData() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)
  const { loading, refreshing, initialized } = useAIProvidersStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (connectionStatus === 'connected' && !initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadAIProvidersData(fetchConfig)
    } else if (connectionStatus !== 'connected' && !initialized) {
      useAIProvidersStore.getState().setLoading(false)
    }
  }, [connectionStatus, initialized, fetchConfig])

  const refresh = useCallback(() => {
    preloadAIProvidersData(fetchConfig, true)
  }, [fetchConfig])

  return { loading, refreshing, refresh }
}
