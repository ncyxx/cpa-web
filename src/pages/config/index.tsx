import { useCallback, useEffect, useRef, useState } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { search, highlightSelectionMatches } from '@codemirror/search'
import { ChevronUp, ChevronDown, Search, RefreshCw } from 'lucide-react'
import { create } from 'zustand'
import { Button, Input } from '@/components/ui'
import { useAuthStore } from '@/stores'
import { configApi } from '@/services/api'

interface ConfigState {
  content: string
  loading: boolean
  initialized: boolean
  setContent: (content: string) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

const useConfigPageStore = create<ConfigState>((set) => ({
  content: '',
  loading: true,
  initialized: false,
  setContent: (content) => set({ content }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
}))

let isLoading = false

async function preloadConfigData(isRefresh = false) {
  const store = useConfigPageStore.getState()
  
  if (isLoading && !isRefresh) return
  if (store.initialized && !isRefresh) return
  
  isLoading = true
  store.setLoading(true)
  
  try {
    const data = await configApi.getConfigYAML()
    store.setContent(data)
    store.setInitialized(true)
  } catch (err) {
    console.error('Failed to load config:', err)
  } finally {
    store.setLoading(false)
    isLoading = false
  }
}

export function ConfigPage() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)

  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const editorRef = useRef<ReactCodeMirrorRef>(null)

  const disableControls = connectionStatus !== 'connected'

  const loadConfig = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await configApi.getConfigYAML()
      setContent(data)
      setDirty(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '加载配置失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadConfig()
    }
  }, [connectionStatus, loadConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      await configApi.putConfigYAML(content)
      setDirty(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      setError(`保存失败: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = useCallback((value: string) => {
    setContent(value)
    setDirty(true)
  }, [])

  // Search functionality
  const performSearch = useCallback((query: string, direction: 'next' | 'prev' = 'next') => {
    if (!query || !editorRef.current?.view) return

    const view = editorRef.current.view
    const doc = view.state.doc.toString()
    const matches: number[] = []
    const lowerQuery = query.toLowerCase()
    const lowerDoc = doc.toLowerCase()

    let pos = 0
    while (pos < lowerDoc.length) {
      const index = lowerDoc.indexOf(lowerQuery, pos)
      if (index === -1) break
      matches.push(index)
      pos = index + 1
    }

    if (matches.length === 0) {
      setSearchResults({ current: 0, total: 0 })
      return
    }

    const selection = view.state.selection.main
    const cursorPos = direction === 'prev' ? selection.from : selection.to
    let currentIndex = 0

    if (direction === 'next') {
      for (let i = 0; i < matches.length; i++) {
        if (matches[i] > cursorPos) {
          currentIndex = i
          break
        }
        if (i === matches.length - 1) {
          currentIndex = 0
        }
      }
    } else {
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i] < cursorPos) {
          currentIndex = i
          break
        }
        if (i === 0) {
          currentIndex = matches.length - 1
        }
      }
    }

    const matchPos = matches[currentIndex]
    setSearchResults({ current: currentIndex + 1, total: matches.length })

    view.dispatch({
      selection: { anchor: matchPos, head: matchPos + query.length },
      scrollIntoView: true
    })
    view.focus()
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (!value) {
      setSearchResults({ current: 0, total: 0 })
      setLastSearchedQuery('')
    } else {
      setSearchResults({ current: 0, total: 0 })
    }
  }, [])

  const executeSearch = useCallback((direction: 'next' | 'prev' = 'next') => {
    if (!searchQuery) return
    setLastSearchedQuery(searchQuery)
    performSearch(searchQuery, direction)
  }, [searchQuery, performSearch])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      executeSearch(e.shiftKey ? 'prev' : 'next')
    }
  }, [executeSearch])

  const getStatusText = () => {
    if (disableControls) return '未连接'
    if (loading) return '加载中...'
    if (error) return '加载失败'
    if (saving) return '保存中...'
    if (dirty) return '已修改'
    return '配置已加载'
  }

  const getStatusClass = () => {
    if (error) return 'text-red-600'
    if (dirty) return 'text-orange-600'
    if (!loading && !saving) return 'text-green-600'
    return 'text-gray-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">配置管理</h1>
        <p className="text-sm text-gray-500 mt-1">直接编辑 config.yaml 配置文件，支持搜索和语法高亮</p>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索配置内容..."
              disabled={disableControls || loading}
              className="pr-24 rounded-xl bg-white border-gray-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && lastSearchedQuery === searchQuery && (
                <span className="text-xs text-gray-400">
                  {searchResults.total > 0
                    ? `${searchResults.current} / ${searchResults.total}`
                    : '无结果'}
                </span>
              )}
              <button
                type="button"
                onClick={() => executeSearch('next')}
                disabled={!searchQuery || disableControls || loading}
                className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => performSearch(lastSearchedQuery, 'prev')}
            disabled={!searchQuery || lastSearchedQuery !== searchQuery || searchResults.total === 0}
            className="rounded-xl h-10 w-10 p-0"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => performSearch(lastSearchedQuery, 'next')}
            disabled={!searchQuery || lastSearchedQuery !== searchQuery || searchResults.total === 0}
            className="rounded-xl h-10 w-10 p-0"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="h-[500px] overflow-hidden">
          {error && !content && (
            <div className="p-4 text-red-600 bg-red-50">{error}</div>
          )}
          <CodeMirror
            ref={editorRef}
            value={content}
            onChange={handleChange}
            extensions={[yaml(), search(), highlightSelectionMatches()]}
            theme="light"
            editable={!disableControls && !loading}
            placeholder="加载配置中..."
            height="500px"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              indentOnInput: true,
              bracketMatching: true,
              autocompletion: false,
              highlightSelectionMatches: true
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <span className={`text-sm font-medium ${getStatusClass()}`}>
            {getStatusText()}
          </span>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadConfig} 
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              重新加载
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={disableControls || loading || !dirty || saving}
              className="rounded-xl"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
