/**
 * Headers 输入组件
 * 支持添加/删除多个 key-value 对
 */

import { Plus, Trash2 } from 'lucide-react'

export interface HeaderEntry {
  key: string
  value: string
}

interface HeadersInputProps {
  headers: HeaderEntry[]
  onChange: (headers: HeaderEntry[]) => void
  disabled?: boolean
}

export function HeadersInput({ headers, onChange, disabled }: HeadersInputProps) {
  const handleAdd = () => {
    onChange([...headers, { key: '', value: '' }])
  }

  const handleRemove = (index: number) => {
    onChange(headers.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: 'key' | 'value', value: string) => {
    onChange(headers.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">自定义 Headers</label>
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
      
      {headers.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">暂无自定义 Headers</p>
      ) : (
        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Header Key"
                value={header.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                disabled={disabled}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Header Value"
                value={header.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
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

// 工具函数：Headers 对象转数组
export function headersToEntries(headers?: Record<string, string>): HeaderEntry[] {
  if (!headers || typeof headers !== 'object') return []
  return Object.entries(headers).map(([key, value]) => ({ key, value }))
}

// 工具函数：数组转 Headers 对象
export function entriesToHeaders(entries: HeaderEntry[]): Record<string, string> {
  const result: Record<string, string> = {}
  entries.forEach(({ key, value }) => {
    if (key.trim()) {
      result[key.trim()] = value
    }
  })
  return result
}
