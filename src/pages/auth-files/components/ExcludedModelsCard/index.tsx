/**
 * OAuth 排除模型卡片组件
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Shield, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { authFilesApi } from '@/services/api/authFiles'

// 预设的 Provider 列表
const PROVIDER_PRESETS = ['gemini', 'gemini-cli', 'vertex', 'aistudio', 'antigravity', 'claude', 'codex', 'qwen', 'iflow']

// sessionStorage 缓存
const CACHE_KEY = 'oauth-excluded-cache'
function getCache(): { data: Record<string, string[]>; unsupported: boolean } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}
function setCache(data: Record<string, string[]>, unsupported: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, unsupported }))
  } catch {}
}

interface ExcludedModelsCardProps {
  existingTypes: string[]
}

export function ExcludedModelsCard({ existingTypes }: ExcludedModelsCardProps) {
  const cached = useRef(getCache())
  const [excluded, setExcluded] = useState<Record<string, string[]>>(cached.current?.data || {})
  const [loading, setLoading] = useState(!cached.current)
  const [unsupported, setUnsupported] = useState(cached.current?.unsupported || false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ provider: '', modelsText: '' })

  // 加载排除列表
  const loadExcluded = useCallback(async () => {
    try {
      const data = await authFilesApi.getOauthExcludedModels()
      setExcluded(data)
      setUnsupported(false)
      setCache(data, false)
    } catch (err: any) {
      console.warn('OAuth excluded models API not available:', err?.status || err?.message)
      setUnsupported(true)
      setExcluded({})
      setCache({}, true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExcluded() }, [loadExcluded])

  // 合并 Provider 选项
  const providerOptions = [...new Set([
    ...PROVIDER_PRESETS,
    ...Object.keys(excluded),
    ...existingTypes.filter(t => t !== 'all' && t !== 'unknown' && t !== 'empty')
  ])]

  // 打开弹窗
  const openModal = (provider?: string) => {
    const models = provider ? excluded[provider] || [] : []
    setForm({
      provider: provider || '',
      modelsText: models.join('\n')
    })
    setModalOpen(true)
  }

  // 保存
  const handleSave = async () => {
    const provider = form.provider.trim()
    if (!provider) {
      alert('请输入 Provider')
      return
    }

    const models = form.modelsText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)

    setSaving(true)
    try {
      if (models.length > 0) {
        await authFilesApi.saveOauthExcludedModels(provider, models)
      } else {
        await authFilesApi.deleteOauthExcludedEntry(provider)
      }
      await loadExcluded()
      setModalOpen(false)
    } catch {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 删除
  const handleDelete = async (provider: string) => {
    if (!confirm(`确定要删除 ${provider} 的排除规则吗？`)) return
    try {
      await authFilesApi.deleteOauthExcludedEntry(provider)
      await loadExcluded()
    } catch {
      alert('删除失败')
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">OAuth 排除模型</h3>
              <p className="text-xs text-gray-500 mt-0.5">配置各 Provider 排除的模型列表</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            disabled={unsupported}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            </div>
          ) : unsupported ? (
            <div className="text-center py-8">
              <p className="text-gray-500">当前版本不支持此功能</p>
              <p className="text-gray-400 text-sm mt-1">请更新 CLI Proxy API 到最新版本</p>
            </div>
          ) : Object.keys(excluded).length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无排除规则</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(excluded).map(([provider, models]) => (
                <div
                  key={provider}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{provider}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {models?.length ? `${models.length} 个模型` : '无模型'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(provider)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(provider)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {form.provider ? '编辑排除规则' : '添加排除规则'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Provider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Provider</label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="输入 Provider 名称"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
                />
                <div className="flex flex-wrap gap-1.5">
                  {providerOptions.map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(prev => ({ ...prev, provider: p }))}
                      className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        form.provider.toLowerCase() === p.toLowerCase()
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Models */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">排除模型</label>
                <textarea
                  value={form.modelsText}
                  onChange={e => setForm(prev => ({ ...prev, modelsText: e.target.value }))}
                  placeholder="每行一个模型名称，支持通配符 *"
                  rows={5}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all resize-none"
                />
                <p className="text-xs text-gray-400">每行一个模型，支持通配符如 gemini-* 或 *-preview</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.provider.trim()}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
