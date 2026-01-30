/**
 * Models 输入组件
 * 支持模型名称和别名映射
 */

import { Plus, Trash2 } from 'lucide-react'
import type { ModelAlias } from '@/services/api/providers'

export interface ModelEntry {
  name: string
  alias: string
}

interface ModelsInputProps {
  models: ModelEntry[]
  onChange: (models: ModelEntry[]) => void
  disabled?: boolean
  label?: string
  placeholder?: { name?: string; alias?: string }
}

export function ModelsInput({ 
  models, 
  onChange, 
  disabled,
  label = '模型映射',
  placeholder = { name: '模型名称', alias: '别名 (可选)' }
}: ModelsInputProps) {
  const handleAdd = () => {
    onChange([...models, { name: '', alias: '' }])
  }

  const handleRemove = (index: number) => {
    onChange(models.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: 'name' | 'alias', value: string) => {
    onChange(models.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3 h-3" />
          添加
        </button>
      </div>
      
      {models.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">暂无模型映射</p>
      ) : (
        <div className="space-y-2">
          {models.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={placeholder.name}
                value={model.name}
                onChange={(e) => handleChange(index, 'name', e.target.value)}
                disabled={disabled}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400">→</span>
              <input
                type="text"
                placeholder={placeholder.alias}
                value={model.alias}
                onChange={(e) => handleChange(index, 'alias', e.target.value)}
                disabled={disabled}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 工具函数：ModelAlias 数组转 ModelEntry 数组
export function modelsToEntries(models?: ModelAlias[]): ModelEntry[] {
  if (!Array.isArray(models) || models.length === 0) {
    return []
  }
  return models.map(m => ({ name: m.name || '', alias: m.alias || '' }))
}

// 工具函数：ModelEntry 数组转 ModelAlias 数组
export function entriesToModels(entries: ModelEntry[]): ModelAlias[] {
  return entries
    .filter(e => e.name.trim())
    .map(e => ({
      name: e.name.trim(),
      alias: e.alias.trim() || undefined
    }))
}
