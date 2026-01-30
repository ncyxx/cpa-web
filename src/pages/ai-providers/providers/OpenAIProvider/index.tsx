/**
 * OpenAI 兼容提供商配置页
 * 字段：name, baseUrl, prefix, headers, apiKeyEntries, models, testModel
 */

import { useState, useCallback } from 'react'
import { Plus, RefreshCw, X, Trash2, Pencil, Copy, Check } from 'lucide-react'
import { useAuthStore, useConfigStore } from '@/stores'
import { providersApi, type OpenAIProviderConfig } from '@/services/api/providers'
import { PROVIDER_CONFIGS } from '../../constants'
import { 
  HeadersInput, headersToEntries, entriesToHeaders, type HeaderEntry,
  ModelsInput, modelsToEntries, entriesToModels, type ModelEntry
} from '../../components'

interface ApiKeyEntryForm {
  apiKey: string
  proxyUrl: string
  headers: HeaderEntry[]
}

interface OpenAIFormState {
  name: string
  baseUrl: string
  prefix: string
  headers: HeaderEntry[]
  apiKeyEntries: ApiKeyEntryForm[]
  models: ModelEntry[]
  testModel: string
}

const emptyApiKeyEntry: ApiKeyEntryForm = { apiKey: '', proxyUrl: '', headers: [] }

const emptyForm: OpenAIFormState = {
  name: '',
  baseUrl: '',
  prefix: '',
  headers: [],
  apiKeyEntries: [{ ...emptyApiKeyEntry }],
  models: [],
  testModel: ''
}

export function OpenAIProvider() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const config = useConfigStore((state) => state.config)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)
  const disableControls = connectionStatus !== 'connected'

  const providers = config?.openaiCompatibility || []
  const [refreshing, setRefreshing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<OpenAIFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const providerConfig = PROVIDER_CONFIGS.openai
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
      const item = providers[index]
      setForm({
        name: item.name || '',
        baseUrl: item.baseUrl || '',
        prefix: item.prefix || '',
        headers: headersToEntries(item.headers),
        apiKeyEntries: (item.apiKeyEntries || []).map((e: { apiKey?: string; proxyUrl?: string; headers?: Record<string, string> }) => ({
          apiKey: e.apiKey || '',
          proxyUrl: e.proxyUrl || '',
          headers: headersToEntries(e.headers)
        })),
        models: modelsToEntries(item.models),
        testModel: item.testModel || ''
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
    if (!form.name.trim() || !form.baseUrl.trim()) return

    setSaving(true)
    try {
      const payload: OpenAIProviderConfig = {
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim(),
        prefix: form.prefix.trim() || undefined,
        headers: entriesToHeaders(form.headers),
        apiKeyEntries: form.apiKeyEntries
          .filter(e => e.apiKey.trim())
          .map(e => ({
            apiKey: e.apiKey.trim(),
            proxyUrl: e.proxyUrl.trim() || undefined,
            headers: entriesToHeaders(e.headers)
          })),
        models: entriesToModels(form.models),
        testModel: form.testModel.trim() || undefined
      }

      const nextList = editingIndex !== null
        ? providers.map((item: OpenAIProviderConfig, idx: number) => idx === editingIndex ? payload : item)
        : [...providers, payload]

      await providersApi.saveOpenAIProviders(nextList)
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
      const name = providers[index]?.name
      await providersApi.deleteOpenAIProvider(name)
      await fetchConfig()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // API Key Entries 操作
  const addApiKeyEntry = () => {
    setForm(prev => ({
      ...prev,
      apiKeyEntries: [...prev.apiKeyEntries, { ...emptyApiKeyEntry }]
    }))
  }

  const removeApiKeyEntry = (index: number) => {
    setForm(prev => ({
      ...prev,
      apiKeyEntries: prev.apiKeyEntries.filter((_, i) => i !== index)
    }))
  }

  const updateApiKeyEntry = (index: number, field: keyof ApiKeyEntryForm, value: any) => {
    setForm(prev => ({
      ...prev,
      apiKeyEntries: prev.apiKeyEntries.map((e, i) => 
        i === index ? { ...e, [field]: value } : e
      )
    }))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${providerConfig.bg} flex items-center justify-center text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{providerConfig.title} 兼容配置</h3>
            <p className="text-xs text-gray-500 mt-0.5">共 {providers.length} 个配置</p>
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
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className={`w-16 h-16 rounded-2xl ${providerConfig.gradientBg} flex items-center justify-center mb-4`}>
              <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium">暂无配置</p>
            <p className="text-sm mt-1">点击"添加"创建新配置</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {providers.map((item: OpenAIProviderConfig, index: number) => (
              <ProviderItem
                key={index}
                provider={item}
                index={index}
                onEdit={() => openModal(index)}
                onDelete={() => handleDelete(index)}
                disabled={disableControls}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r ${providerConfig.headerBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${providerConfig.bg} flex items-center justify-center text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {editingIndex !== null ? '编辑' : '添加'} {providerConfig.title} 兼容配置
                </h3>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg hover:bg-white/50 flex items-center justify-center text-gray-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">名称 *</label>
                  <input type="text" placeholder="提供商名称" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Prefix</label>
                  <input type="text" placeholder="模型前缀" value={form.prefix} onChange={(e) => setForm(prev => ({ ...prev, prefix: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Base URL *</label>
                <input type="text" placeholder="https://api.example.com/v1" value={form.baseUrl} onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>

              <HeadersInput headers={form.headers} onChange={(headers) => setForm(prev => ({ ...prev, headers }))} disabled={saving} />

              {/* API Key Entries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">API Keys</label>
                  <button type="button" onClick={addApiKeyEntry} disabled={saving} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50">
                    <Plus className="w-3 h-3" />
                    添加 Key
                  </button>
                </div>
                <div className="space-y-3">
                  {form.apiKeyEntries.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="API Key" value={entry.apiKey} onChange={(e) => updateApiKeyEntry(index, 'apiKey', e.target.value)} disabled={saving} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                        {form.apiKeyEntries.length > 1 && (
                          <button type="button" onClick={() => removeApiKeyEntry(index)} disabled={saving} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input type="text" placeholder="Proxy URL (可选)" value={entry.proxyUrl} onChange={(e) => updateApiKeyEntry(index, 'proxyUrl', e.target.value)} disabled={saving} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              <ModelsInput models={form.models} onChange={(models) => setForm(prev => ({ ...prev, models }))} disabled={saving} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">测试模型</label>
                <input type="text" placeholder="用于测试连接的模型名称" value={form.testModel} onChange={(e) => setForm(prev => ({ ...prev, testModel: e.target.value }))} disabled={saving} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 shrink-0">
              <button onClick={closeModal} disabled={saving} className="h-9 px-4 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer">取消</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.baseUrl.trim()} className={`h-9 px-4 rounded-lg ${providerConfig.bg} text-white text-sm font-medium hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50`}>{saving ? '保存中...' : editingIndex !== null ? '更新' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// OpenAI Provider 列表项
function ProviderItem({ provider, index, onEdit, onDelete, disabled }: {
  provider: OpenAIProviderConfig
  index: number
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const keyCount = provider.apiKeyEntries?.length || 0

  const handleCopy = () => {
    navigator.clipboard.writeText(provider.baseUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
      <span className="w-8 h-6 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0">
        #{index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{provider.name}</span>
          {provider.prefix && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">prefix: {provider.prefix}</span>}
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{keyCount} keys</span>
        </div>
        <div className="text-xs text-gray-500 truncate mt-0.5">{provider.baseUrl}</div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={handleCopy} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} disabled={disabled} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDelete} disabled={disabled} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
