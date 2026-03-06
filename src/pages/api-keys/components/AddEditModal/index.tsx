/**
 * 添加/编辑密钥弹窗组件
 */

import { Key, X, Sparkles } from 'lucide-react'

interface AddEditModalProps {
  isEdit: boolean
  inputValue: string
  saving: boolean
  onInputChange: (value: string) => void
  onGenerate: () => void
  onSave: () => void
  onClose: () => void
}

export function AddEditModal({
  isEdit,
  inputValue,
  saving,
  onInputChange,
  onGenerate,
  onSave,
  onClose
}: AddEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900">{isEdit ? '编辑密钥' : '添加密钥'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">API 密钥</label>
            <input
              type="text"
              placeholder="输入或生成密钥..."
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {!isEdit && (
            <button
              onClick={onGenerate}
              className="h-9 px-4 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              随机生成
            </button>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={saving || !inputValue.trim()}
            className="h-9 px-4 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? '保存中...' : isEdit ? '更新' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
