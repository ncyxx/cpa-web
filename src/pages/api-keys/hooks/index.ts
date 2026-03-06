/**
 * API 密钥页面 Hooks
 * 使用 Zustand store 缓存数据，避免刷新闪屏
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useAuthStore } from '@/stores'
import { apiKeysApi } from '@/services/api'
import { generateRandomApiKey, generateMultipleApiKeys } from '../constants'

interface ApiKeysState {
  apiKeys: string[]
  loading: boolean
  initialized: boolean
  setApiKeys: (keys: string[] | ((prev: string[]) => string[])) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useApiKeysStore = create<ApiKeysState>((set) => ({
  apiKeys: [],
  loading: true,
  initialized: false,
  setApiKeys: (keys) => set((state) => ({
    apiKeys: typeof keys === 'function' ? keys(state.apiKeys) : keys
  })),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}))

let isLoading = false

export async function preloadApiKeysData(isRefresh = false) {
  const store = useApiKeysStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  store.setLoading(true)
  
  try {
    const keys = await apiKeysApi.list()
    store.setApiKeys(keys)
    store.setInitialized(true)
  } catch (err) {
    console.error('Failed to load API keys:', err)
  } finally {
    store.setLoading(false)
    isLoading = false
  }
}

/**
 * API 密钥数据 Hook
 */
export function useApiKeysData() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const { apiKeys, loading, initialized, setApiKeys } = useApiKeysStore()
  const [error, setError] = useState('')
  const hasFetched = useRef(false)

  const loadApiKeys = useCallback(async () => {
    setError('')
    await preloadApiKeysData(true)
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected' && !initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadApiKeysData()
    }
  }, [connectionStatus, initialized])

  return { apiKeys, setApiKeys, loading, error, setError, loadApiKeys, connectionStatus }
}

/**
 * 选择和显示状态 Hook
 */
export function useApiKeysSelection(apiKeys: string[]) {
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set())
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())

  const toggleVisibility = useCallback((index: number) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === apiKeys.length) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(apiKeys.map((_, i) => i)))
    }
  }, [selectedKeys.size, apiKeys])

  const isAllSelected = useMemo(() => 
    apiKeys.length > 0 && selectedKeys.size === apiKeys.length, 
    [apiKeys.length, selectedKeys.size]
  )

  // 重置选择状态
  const resetSelection = useCallback(() => {
    setSelectedKeys(new Set())
    setVisibleKeys(new Set())
  }, [])

  return {
    selectedKeys, setSelectedKeys,
    visibleKeys,
    toggleVisibility,
    handleToggleSelect,
    handleSelectAll,
    isAllSelected,
    resetSelection
  }
}

/**
 * API 密钥操作 Hook
 */
export function useApiKeysActions(
  apiKeys: string[],
  setApiKeys: React.Dispatch<React.SetStateAction<string[]>>,
  setError: (error: string) => void,
  selectedKeys: Set<number>,
  setSelectedKeys: React.Dispatch<React.SetStateAction<Set<number>>>
) {
  const [saving, setSaving] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // 复制
  const handleCopy = useCallback((key: string, index: number) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }, [])

  // 导出
  const handleExport = useCallback(() => {
    const keysToExport = selectedKeys.size > 0 
      ? apiKeys.filter((_, i) => selectedKeys.has(i))
      : apiKeys
    if (keysToExport.length === 0) return

    const content = keysToExport.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-keys-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [apiKeys, selectedKeys])

  // 保存单个
  const handleSave = useCallback(async (value: string, editingIndex: number | null) => {
    const trimmed = value.trim()
    if (!trimmed) return false

    const isEdit = editingIndex !== null
    const nextKeys = isEdit
      ? apiKeys.map((key, idx) => (idx === editingIndex ? trimmed : key))
      : [...apiKeys, trimmed]

    setSaving(true)
    try {
      if (isEdit && editingIndex !== null) {
        await apiKeysApi.update(editingIndex, trimmed)
      } else {
        await apiKeysApi.replace(nextKeys)
      }
      setApiKeys(nextKeys)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败')
      return false
    } finally {
      setSaving(false)
    }
  }, [apiKeys, setApiKeys, setError])

  // 批量生成
  const handleBatchGenerate = useCallback(async (count: number) => {
    if (isNaN(count) || count < 1 || count > 100) return false

    setSaving(true)
    try {
      const newKeys = generateMultipleApiKeys(count)
      const nextKeys = [...apiKeys, ...newKeys]
      await apiKeysApi.replace(nextKeys)
      setApiKeys(nextKeys)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成失败')
      return false
    } finally {
      setSaving(false)
    }
  }, [apiKeys, setApiKeys, setError])

  // 删除
  const handleDelete = useCallback(async (index: number) => {
    if (!window.confirm('确定要删除这个密钥吗？')) return
    try {
      await apiKeysApi.delete(index)
      setApiKeys(prev => prev.filter((_, idx) => idx !== index))
      setSelectedKeys(prev => { const next = new Set(prev); next.delete(index); return next })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }, [setApiKeys, setSelectedKeys, setError])

  return {
    saving,
    copiedIndex,
    handleCopy,
    handleExport,
    handleSave,
    handleBatchGenerate,
    handleDelete,
    generateRandomApiKey
  }
}

/**
 * 模态框状态 Hook
 */
export function useApiKeysModals() {
  const [modalType, setModalType] = useState<'add' | 'edit' | 'batch' | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [batchCount, setBatchCount] = useState('5')

  const openAddModal = useCallback(() => {
    setModalType('add')
    setEditingIndex(null)
    setInputValue('')
  }, [])

  const openEditModal = useCallback((index: number, currentValue: string) => {
    setModalType('edit')
    setEditingIndex(index)
    setInputValue(currentValue)
  }, [])

  const openBatchModal = useCallback(() => {
    setModalType('batch')
    setBatchCount('5')
  }, [])

  const closeModal = useCallback(() => {
    setModalType(null)
    setInputValue('')
    setEditingIndex(null)
  }, [])

  return {
    modalType,
    editingIndex,
    inputValue, setInputValue,
    batchCount, setBatchCount,
    openAddModal,
    openEditModal,
    openBatchModal,
    closeModal
  }
}
