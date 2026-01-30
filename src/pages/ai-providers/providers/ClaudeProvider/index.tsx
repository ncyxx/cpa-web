/**
 * Claude 提供商配置页
 * 字段：apiKey, prefix, baseUrl, proxyUrl, headers, models, excludedModels
 */

import { useState, useCallback } from 'react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { useAuthStore, useConfigStore } from '@/stores'
import { providersApi, type ProviderKeyConfig } from '@/services/api/providers'
import { PROVIDER_CONFIGS } from '../../constants'
import { 
  KeyItem, 
  HeadersInput, headersToEntries, entriesToHeaders, type HeaderEntry,
  ModelsInput, modelsToEntries, entriesToModels, type ModelEntry
} from '../../components'

interface ClaudeFormState {
  apiKey: string
  prefix: string
  baseUrl: string
  proxyUrl: string
  headers: HeaderEntry[]
  models: ModelEntry[]
  excludedModels: string
}

const emptyForm: ClaudeFormState = {
  apiKey: '',
  prefix: '',
  baseUrl: '',
  proxyUrl: '',
  headers: [],
  models: [],
  excludedModels: ''
}

export function ClaudeProvider() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const config = useConfigStore((state) => state.config)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)
  const disableControls = connectionStatus !== 'connected'

  const keys = config?.claudeApiKeys || []
  const [refreshing, setRefreshing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<ClaudeFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const providerConfig = PROVIDER_CONFIGS.claude
  const Icon = providerConfig.icon

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchConfig()
    } finally {
      setRefreshing(false)
    }
  }, [fetchConfig])

  const openModal = (index: number | null = null) => {
    if (index !== null) {
      const item = keys[index]
      setForm({
        apiKey: item.apiKey || '',
        prefix: item.prefix || '',
        baseUrl: item.baseUrl || '',
        proxyUrl: item.proxyUrl || '',
        headers: headersToEntries(item.headers),
        models: modelsToEntries(item.models),
        excludedModels: (item.excludedModels || []).join('\n')
      })
    } else {
      setForm(emptyForm)
    }
    setEditingIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingIndex(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.apiKey.trim()) return

    setSaving(true)
    try {
      const payload: ProviderKeyConfig = {
        apiKey: form.apiKey.trim(),
        prefix: form.prefix.trim() || undefined,
        baseUrl: form.baseUrl.trim() || undefined,
        proxyUrl: form.proxyUrl.trim() || undefined,
        headers: entriesToHeaders(form.headers),
        models: entriesToModels(form.models),
        excludedModels: form.excludedModels.split('\n').map(s => s.trim()).filter(Boolean)
      }

      const nextList = editingIndex !== null
        ? keys.map((item: ProviderKeyConfig, idx: number) => idx === editingIndex ? payload : item)
        : [...keys, payload]

      await providersApi.saveClaudeConfigs(nextList)
      await fetchConfig()
      closeModal()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (index: number) => {
    if (!window.confirm('确定要删除这个配置吗？')) return

    try {
      const apiKey = keys[index]?.apiKey
      await providersApi.deleteClaudeConfig(apiKey)
      await fetchConfig()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleToggle = async (index: number, enabled: boolean) => {
    const item = keys[index]
    if (!item) return

    const DISABLE_RULE = '*'
    let excludedModels = item.excludedModels || []
    
    if (enabled) {
      excludedModels = excludedModels.filter((m: string) => m !== DISABLE_RULE)
    } else {
      if (!excludedModels.includes(DISABLE_RULE)) {
        excludedModels = [...excludedModels, DISABLE_RULE]
      }
    }

    const nextItem = { ...item, excludedModels }
    const nextList = keys.map((k: ProviderKeyConfig, idx: number) => idx === index ? nextItem : k)

    try {
      await providersApi.saveClaudeConfigs(nextList)
      await fetchConfig()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const isEnabled = (item: ProviderKeyConfig) => !(item.excludedModels || []).includes('*')

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${providerConfig.bg} flex items-center justify-center text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{providerConfig.title} 配置</h3>
            <p className="text-xs text-gray-500 mt-0.5">共 {keys.length} 个配置</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} disabled={disableControls} className={`h-9 px-4 rounded-lg ${providerConfig.bg} text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2`}>
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className={`w-16 h-16 rounded-2xl ${providerConfig.gradientBg} flex items-center justify-center mb-4`}>
              <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium">暂无配置</p>
            <p className="text-sm mt-1">点击"添加"创建新配置</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {keys.map((item: ProviderKeyConfig, index: number) => (
              <KeyItem
                key={index}
                apiKey={item.apiKey}
                index={index}
                prefix={item.prefix}
                baseUrl={item.baseUrl}
                enabled={isEnabled(item)}
                onEdit={() => openModal(index)}
                onDelete={() => handleDelete(index)}
                onToggle={(enabled) => handleToggle(index, enabled)}
                disabled={disableControls}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r ${providerConfig.headerBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${providerConfig.bg} flex items-center justify-center text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {editingIndex !== null ? '编辑' : '添加'} {providerConfig.title} 配置
                </h3>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-white/50 flex items-center justify-center text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">API Key *</label>
                <input type="text" placeholder="输入 Claude API Key..." value={form.apiKey} onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Prefix</label>
                  <input type="text" placeholder="模型前缀" value={form.prefix} onChange={(e) => setForm(prev => ({ ...prev, prefix: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Base URL</label>
                  <input type="text" placeholder="自定义 API 地址" value={form.baseUrl} onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Proxy URL</label>
                <input type="text" placeholder="代理地址" value={form.proxyUrl} onChange={(e) => setForm(prev => ({ ...prev, proxyUrl: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>

              <HeadersInput headers={form.headers} onChange={(headers) => setForm(prev => ({ ...prev, headers }))} disabled={saving} />

              <ModelsInput models={form.models} onChange={(models) => setForm(prev => ({ ...prev, models }))} disabled={saving} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">排除的模型</label>
                <textarea placeholder="每行一个模型名称" value={form.excludedModels} onChange={(e) => setForm(prev => ({ ...prev, excludedModels: e.target.value }))} disabled={saving} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
              <button onClick={closeModal} disabled={saving} className="h-9 px-4 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer">取消</button>
              <button onClick={handleSave} disabled={saving || !form.apiKey.trim()} className={`h-9 px-4 rounded-lg ${providerConfig.bg} text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50`}>{saving ? '保存中...' : editingIndex !== null ? '更新' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
