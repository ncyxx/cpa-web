/**
 * API Key 列表项组件
 */

import { useState } from 'react'
import { Eye, EyeOff, Copy, Check, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface KeyItemProps {
  apiKey: string
  index: number
  prefix?: string
  baseUrl?: string
  enabled?: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle?: (enabled: boolean) => void
  disabled?: boolean
}

// 遮罩 API Key
function maskApiKey(key: string): string {
  if (!key || key.length < 10) return key
  return `${key.slice(0, 8)}${'*'.repeat(20)}${key.slice(-4)}`
}

export function KeyItem({ 
  apiKey, 
  index, 
  prefix,
  baseUrl,
  enabled = true,
  onEdit, 
  onDelete,
  onToggle,
  disabled 
}: KeyItemProps) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={`px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group ${!enabled ? 'opacity-60' : ''}`}>
      {/* 序号 */}
      <span className="w-8 h-6 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0">
        #{index + 1}
      </span>

      {/* Key 信息 */}
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm text-gray-700 truncate">
          {visible ? apiKey : maskApiKey(apiKey)}
        </div>
        {(prefix || baseUrl) && (
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            {prefix && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">prefix: {prefix}</span>}
            {baseUrl && <span className="truncate">{baseUrl}</span>}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onToggle && (
          <button 
            onClick={() => onToggle(!enabled)} 
            disabled={disabled}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title={enabled ? '禁用' : '启用'}
          >
            {enabled ? (
              <ToggleRight className="w-4 h-4 text-green-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
        <button 
          onClick={() => setVisible(!visible)} 
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title={visible ? '隐藏' : '显示'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button 
          onClick={handleCopy} 
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title="复制"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        <button 
          onClick={onEdit} 
          disabled={disabled} 
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
          title="编辑"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete} 
          disabled={disabled} 
          className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
