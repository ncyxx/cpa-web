/**
 * Ampcode (Amp CLI 集成) 提供商配置页
 * 字段：upstreamUrl, upstreamApiKey, forceModelMappings, modelMappings
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { RefreshCw, Plus, Trash2, Save, Terminal } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { ampcodeApi, type AmpcodeConfig } from '@/services/api'

interface ModelMappingEntry {
  from: string
  to: string
}

export function AmpcodeProvider() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const disableControls = connectionStatus !== 'connected'

  const [ampcodeConfig, setAmpcodeConfig] = useState<AmpcodeConfig>({})
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const hasFetched = useRef(false)

  // 表单状态
  const [upstreamUrl, setUpstreamUrl] = useState('')
  const [upstreamApiKey, setUpstreamApiKey] = useState('')
  const [forceModelMappings, setForceModelMappings] = useState(false)
  const [mappings, setMappings] = useState<ModelMappingEntry[]>([])

  // 首次加载时获取 ampcode 数据
  useEffect(() => {
    if (connectionStatus === 'connected' && !hasFetched.current) {
      hasFetched.current = true
      ampcodeApi.getAmpcode().then(setAmpcodeConfig).catch(console.error)
    }
  }, [connectionStatus])

  // 同步 config 数据到表单
  useEffect(() => {
    setUpstreamUrl(ampcodeConfig.upstreamUrl || '')
    setUpstreamApiKey(ampcodeConfig.upstreamApiKey || '')
    setForceModelMappings(ampcodeConfig.forceModelMappings || false)
    setMappings((ampcodeConfig.modelMappings || []).map((m: { from: string; to: string }) => ({ from: m.from, to: m.to })))
  }, [ampcodeConfig])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const data = await ampcodeApi.getAmpcode()
      setAmpcodeConfig(data)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // 保存 Upstream URL
  const handleSaveUpstreamUrl = async () => {
    setSaving(true)
    try {
      if (upstreamUrl.trim()) {
        await ampcodeApi.updateUpstreamUrl(upstreamUrl.trim())
      } else {
        await ampcodeApi.clearUpstreamUrl()
      }
      const data = await ampcodeApi.getAmpcode()
      setAmpcodeConfig(data)
    } catch (err) {
      console.error('Save upstream URL failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // 保存 Upstream API Key
  const handleSaveUpstreamApiKey = async () => {
    setSaving(true)
    try {
      if (upstreamApiKey.trim()) {
        await ampcodeApi.updateUpstreamApiKey(upstreamApiKey.trim())
      } else {
        await ampcodeApi.clearUpstreamApiKey()
      }
      const data = await ampcodeApi.getAmpcode()
      setAmpcodeConfig(data)
    } catch (err) {
      console.error('Save upstream API key failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // 保存强制模型映射
  const handleSaveForceModelMappings = async () => {
    setSaving(true)
    try {
      await ampcodeApi.updateForceModelMappings(forceModelMappings)
      const data = await ampcodeApi.getAmpcode()
      setAmpcodeConfig(data)
    } catch (err) {
      console.error('Save force model mappings failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // 保存模型映射
  const handleSaveMappings = async () => {
    setSaving(true)
    try {
      const validMappings = mappings
        .filter(m => m.from.trim() && m.to.trim())
        .map(m => ({ from: m.from.trim(), to: m.to.trim() }))
      await ampcodeApi.saveModelMappings(validMappings)
      const data = await ampcodeApi.getAmpcode()
      setAmpcodeConfig(data)
    } catch (err) {
      console.error('Save model mappings failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // 添加映射
  const addMapping = () => {
    setMappings([...mappings, { from: '', to: '' }])
  }

  // 删除映射
  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
  }

  // 更新映射
  const updateMapping = (index: number, field: 'from' | 'to', value: string) => {
    setMappings(mappings.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const mappingCount = ampcodeConfig.modelMappings?.length || 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Amp CLI 集成 (ampcode)</h3>
            <p className="text-xs text-gray-500 mt-0.5">映射数量: {mappingCount}</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing} 
          className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Upstream URL */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Upstream URL</label>
                <button
                  onClick={handleSaveUpstreamUrl}
                  disabled={saving || disableControls}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  保存
                </button>
              </div>
              <input
                type="text"
                placeholder="https://api.example.com"
                value={upstreamUrl}
                onChange={(e) => setUpstreamUrl(e.target.value)}
                disabled={saving || disableControls}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                当前值: {ampcodeConfig.upstreamUrl || '未设置'}
              </p>
            </div>

            {/* Upstream API Key */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Upstream API Key (Amp官方)</label>
                <button
                  onClick={handleSaveUpstreamApiKey}
                  disabled={saving || disableControls}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  保存
                </button>
              </div>
              <input
                type="password"
                placeholder="输入 API Key..."
                value={upstreamApiKey}
                onChange={(e) => setUpstreamApiKey(e.target.value)}
                disabled={saving || disableControls}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                当前值: {ampcodeConfig.upstreamApiKey ? '已设置' : '未设置'}
              </p>
            </div>

            {/* Force Model Mappings */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">强制应用模型映射</label>
                  <p className="text-xs text-gray-500 mt-0.5">启用后将强制使用下方的模型映射规则</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForceModelMappings(!forceModelMappings)}
                    disabled={saving || disableControls}
                    className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                      forceModelMappings ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      forceModelMappings ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <button
                    onClick={handleSaveForceModelMappings}
                    disabled={saving || disableControls}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    保存
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                当前值: {ampcodeConfig.forceModelMappings ? '是' : '否'}
              </p>
            </div>

            {/* Model Mappings */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">模型映射</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addMapping}
                    disabled={saving || disableControls}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    添加
                  </button>
                  <button
                    onClick={handleSaveMappings}
                    disabled={saving || disableControls}
                    className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    保存全部
                  </button>
                </div>
              </div>

              {mappings.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">暂无模型映射</p>
              ) : (
                <div className="space-y-2">
                  {mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="源模型名称"
                        value={mapping.from}
                        onChange={(e) => updateMapping(index, 'from', e.target.value)}
                        disabled={saving || disableControls}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-400">→</span>
                      <input
                        type="text"
                        placeholder="目标模型名称"
                        value={mapping.to}
                        onChange={(e) => updateMapping(index, 'to', e.target.value)}
                        disabled={saving || disableControls}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeMapping(index)}
                        disabled={saving || disableControls}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
      </div>
    </div>
  )
}
