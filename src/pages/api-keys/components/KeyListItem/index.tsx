/**
 * 密钥列表项组件
 */

import { Eye, EyeOff, Copy, Check, Pencil, Trash2 } from 'lucide-react'
import { maskApiKey } from '../../constants'

interface KeyListItemProps {
  apiKey: string
  index: number
  isSelected: boolean
  isVisible: boolean
  isCopied: boolean
  disabled: boolean
  onToggleSelect: () => void
  onToggleVisibility: () => void
  onCopy: () => void
  onEdit: () => void
  onDelete: () => void
}

export function KeyListItem({
  apiKey,
  index,
  isSelected,
  isVisible,
  isCopied,
  disabled,
  onToggleSelect,
  onToggleVisibility,
  onCopy,
  onEdit,
  onDelete
}: KeyListItemProps) {
  return (
    <div className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
      />
      <span className="w-8 h-6 rounded-md bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 text-xs font-semibold flex items-center justify-center">
        #{index + 1}
      </span>
      <span className="flex-1 font-mono text-sm text-gray-700 truncate">
        {isVisible ? apiKey : maskApiKey(apiKey)}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggleVisibility}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title={isVisible ? '隐藏' : '显示'}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={onCopy}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title="复制"
        >
          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
