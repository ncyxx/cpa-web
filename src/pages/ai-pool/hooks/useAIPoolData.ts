/**
 * AI 号池数据 Hook
 * 使用 Zustand store 缓存数据，避免刷新闪屏
 */

import { useCallback, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { kiroApi, type KiroToken } from '@/services/api/kiro'
import { authFilesApi, type AuthFile } from '@/services/api/authFiles'

interface AIPoolState {
  kiroTokens: KiroToken[]
  authFiles: AuthFile[]
  loading: boolean
  refreshing: boolean
  initialized: boolean
  setKiroTokens: (tokens: KiroToken[]) => void
  setAuthFiles: (files: AuthFile[]) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInitialized: (initialized: boolean) => void
}

// 纯内存存储
export const useAIPoolStore = create<AIPoolState>((set) => ({
  kiroTokens: [],
  authFiles: [],
  loading: true,
  refreshing: false,
  initialized: false,
  setKiroTokens: (kiroTokens) => set({ kiroTokens }),
  setAuthFiles: (authFiles) => set({ authFiles }),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInitialized: (initialized) => set({ initialized }),
}))

// 防止重复调用
let isLoading = false

// 预加载函数
export async function preloadAIPoolData(isRefresh = false) {
  const store = useAIPoolStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  
  if (isRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }
  
  try {
    const [kiroRes, authRes] = await Promise.all([
      kiroApi.listTokens().catch(() => ({ tokens: [] })),
      authFilesApi.list().catch(() => ({ files: [] }))
    ])
    
    store.setKiroTokens(kiroRes.tokens || [])
    store.setAuthFiles(authRes.files || [])
    store.setInitialized(true)
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
    isLoading = false
  }
}

export function useAIPoolData() {
  const { kiroTokens, authFiles, loading, refreshing, initialized } = useAIPoolStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadAIPoolData()
    }
  }, [initialized])

  const refresh = useCallback(() => {
    preloadAIPoolData(true)
  }, [])

  return {
    kiroTokens,
    authFiles,
    loading,
    refreshing,
    refresh
  }
}
