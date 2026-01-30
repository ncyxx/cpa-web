/**
 * iFlow Cookie 认证模态框
 */

import { useEffect } from 'react'
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { IFlowCookieResponse } from '@/services/api/oauth'

interface IFlowModalProps {
  isOpen: boolean
  onClose: () => void
  cookie: string
  loading: boolean
  result: IFlowCookieResponse | null
  error: string | null
  onCookieChange: (value: string) => void
  onSubmit: () => void
}

export function IFlowModal({
  isOpen,
  onClose,
  cookie,
  loading,
  result,
  error,
  onCookieChange,
  onSubmit
}: IFlowModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <span className="text-lg font-bold text-cyan-600">i</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">iFlow Cookie</h3>
                <p className="text-sm text-gray-500">使用 Cookie 认证</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Cookie Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cookie</label>
            <textarea
              value={cookie}
              onChange={e => onCookieChange(e.target.value)}
              placeholder="粘贴 iFlow 的 Cookie"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all resize-none"
            />
            <p className="text-xs text-gray-400">从浏览器开发者工具中复制 Cookie</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Result */}
          {result?.status === 'ok' && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                认证成功
              </div>
              <div className="space-y-1 text-sm">
                {result.email && <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{result.email}</span></p>}
                {result.expired && <p><span className="text-gray-500">过期:</span> <span className="text-gray-900">{result.expired}</span></p>}
                {result.type && <p><span className="text-gray-500">类型:</span> <span className="text-gray-900">{result.type}</span></p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer">
            {result?.status === 'ok' ? '完成' : '取消'}
          </button>
          {result?.status !== 'ok' && (
            <button
              onClick={onSubmit}
              disabled={loading || !cookie.trim()}
              className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              认证
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
