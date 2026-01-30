/**
 * 认证文件页面 Hooks
 * 使用 Zustand store 缓存数据，避免刷新闪屏
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { create } from 'zustand'
import { authFilesApi, type AuthFile } from '@/services/api/authFiles'
import { PAGE_SIZE } from '../constants'

interface AuthFilesState {
  files: AuthFile[]
  loading: boolean
  refreshing: boolean
  initialized: boolean
  setFiles: (files: AuthFile[] | ((prev: AuthFile[]) => AuthFile[])) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setInitialized: (initialized: boolean) => void
}

export const useAuthFilesStore = create<AuthFilesState>((set) => ({
  files: [],
  loading: true,
  refreshing: false,
  initialized: false,
  setFiles: (files) => set((state) => ({ 
    files: typeof files === 'function' ? files(state.files) : files 
  })),
  setLoading: (loading) => set({ loading }),
  setRefreshing: (refreshing) => set({ refreshing }),
  setInitialized: (initialized) => set({ initialized }),
}))

let isLoading = false

export async function preloadAuthFilesData(isRefresh = false) {
  const store = useAuthFilesStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  
  if (isRefresh) {
    store.setRefreshing(true)
  } else {
    store.setLoading(true)
  }
  
  try {
    const res = await authFilesApi.list()
    store.setFiles(res?.files || [])
    store.setInitialized(true)
  } catch (err) {
    console.error('Failed to load auth files:', err)
  } finally {
    store.setLoading(false)
    store.setRefreshing(false)
    isLoading = false
  }
}

/**
 * 认证文件数据 Hook
 */
export function useAuthFilesData() {
  const { files, loading, refreshing, initialized, setFiles } = useAuthFilesStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!initialized && !hasFetched.current) {
      hasFetched.current = true
      preloadAuthFilesData()
    }
  }, [initialized])

  const loadFiles = useCallback(async (showRefreshing = false) => {
    await preloadAuthFilesData(showRefreshing)
  }, [])

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + (f.size || 0), 0), [files])

  return { files, setFiles, loading, refreshing, loadFiles, totalSize }
}

/**
 * 筛选和分页 Hook
 */
export function useAuthFilesFilter(files: AuthFile[]) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // 筛选后的文件
  const filteredFiles = useMemo(() => {
    return files.filter(item => {
      const itemType = (item.type || '').toLowerCase()
      const matchType = filter === 'all' || itemType === filter.toLowerCase()
      const term = search.trim().toLowerCase()
      const matchSearch = !term ||
        item.name.toLowerCase().includes(term) ||
        itemType.includes(term) ||
        (item.provider || '').toLowerCase().includes(term) ||
        (item.email || '').toLowerCase().includes(term)
      return matchType && matchSearch
    })
  }, [files, filter, search])

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredFiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // 存在的类型
  const existingTypes = useMemo(() => {
    const types = new Set<string>(['all'])
    files.forEach(f => {
      const t = (f.type || '').toLowerCase()
      if (t) types.add(t)
    })
    return Array.from(types)
  }, [files])

  return {
    filter, setFilter,
    search, setSearch,
    page, setPage,
    filteredFiles,
    pageItems,
    totalPages,
    currentPage,
    existingTypes
  }
}

/**
 * 文件操作 Hook
 */
export function useAuthFilesActions(
  setFiles: React.Dispatch<React.SetStateAction<AuthFile[]>>,
  loadFiles: (showRefreshing?: boolean) => Promise<void>,
  filter: string,
  filteredFiles: AuthFile[],
  setFilter: (f: string) => void
) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // 上传文件
  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return

    const validFiles = Array.from(fileList).filter(f => f.name.endsWith('.json'))
    if (validFiles.length === 0) {
      alert('请选择 JSON 文件')
      return false
    }

    setUploading(true)
    let success = 0, failed = 0

    for (const file of validFiles) {
      try {
        await authFilesApi.upload(file)
        success++
      } catch {
        failed++
      }
    }

    setUploading(false)
    if (success > 0) loadFiles(true)
    if (failed > 0) alert(`上传完成: 成功 ${success}, 失败 ${failed}`)
    return true
  }, [loadFiles])

  // 删除单个文件
  const handleDelete = useCallback(async (name: string) => {
    if (!confirm(`确定要删除 "${name}" 吗？`)) return
    setDeleting(name)
    try {
      await authFilesApi.deleteFile(name)
      setFiles(prev => prev.filter(f => f.name !== name))
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }, [setFiles])

  // 批量删除
  const handleDeleteFiltered = useCallback(async (typeLabel: string) => {
    const isFiltered = filter !== 'all'
    const count = filteredFiles.length
    const confirmMsg = isFiltered
      ? `确定要删除所有 ${typeLabel} 类型的 ${count} 个文件吗？`
      : `确定要删除全部 ${count} 个认证文件吗？此操作不可恢复！`

    if (!confirm(confirmMsg)) return

    setDeleting('all')
    try {
      if (!isFiltered) {
        await authFilesApi.deleteAll()
        setFiles([])
      } else {
        for (const file of filteredFiles) {
          try { await authFilesApi.deleteFile(file.name) } catch {}
        }
        setFiles(prev => prev.filter(f => (f.type || '').toLowerCase() !== filter.toLowerCase()))
      }
      setFilter('all')
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }, [filter, filteredFiles, setFiles, setFilter])

  // 下载文件
  const handleDownload = useCallback(async (file: AuthFile) => {
    try {
      const res = await authFilesApi.download(file.name)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('下载失败')
    }
  }, [])

  return { uploading, deleting, handleUpload, handleDelete, handleDeleteFiltered, handleDownload }
}

/**
 * 弹窗状态 Hook
 */
export function useAuthFilesModals() {
  const [modelsModal, setModelsModal] = useState<{
    open: boolean
    file: AuthFile | null
    models: any[]
    loading: boolean
  }>({ open: false, file: null, models: [], loading: false })

  const [detailModal, setDetailModal] = useState<{
    open: boolean
    file: AuthFile | null
  }>({ open: false, file: null })

  const showModels = useCallback(async (file: AuthFile) => {
    setModelsModal({ open: true, file, models: [], loading: true })
    try {
      const models = await authFilesApi.getModels(file.name)
      setModelsModal(prev => ({ ...prev, models, loading: false }))
    } catch {
      setModelsModal(prev => ({ ...prev, models: [], loading: false }))
    }
  }, [])

  const closeModels = useCallback(() => {
    setModelsModal({ open: false, file: null, models: [], loading: false })
  }, [])

  const showDetail = useCallback((file: AuthFile) => {
    setDetailModal({ open: true, file })
  }, [])

  const closeDetail = useCallback(() => {
    setDetailModal({ open: false, file: null })
  }, [])

  return { modelsModal, detailModal, showModels, closeModels, showDetail, closeDetail }
}
