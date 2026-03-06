/**
 * 批量生成弹窗组件
 */

import { Sparkles, X } from 'lucide-react'

interface BatchModalProps {
  batchCount: string
  saving: boolean
  onCountChange: (value: string) => void
  onGenerate: () => void
  onClose: () => void
}

export function BatchModal({
  batchCount,
  saving,
  onCountChange,
  onGenerate,
  onClose
}: BatchModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900">批量生成密钥</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">生成数量</label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="1-100"
              value={batchCount}
              onChange={(e) => onCountChange(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500">将随机生成指定数量的 API 密钥，格式为 sk-xxx</p>
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
            onClick={onGenerate}
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? '生成中...' : '生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
