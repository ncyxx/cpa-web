/**
 * Vertex AI 导入模态框
 */

import { useEffect, useRef } from 'react'
import { X, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { VertexImportResponse } from '@/services/api/oauth'

interface VertexModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  location: string
  loading: boolean
  result: VertexImportResponse | null
  error: string | null
  onFileChange: (file: File | null) => void
  onLocationChange: (value: string) => void
  onSubmit: () => void
}

export function VertexModal({
  isOpen,
  onClose,
  file,
  location,
  loading,
  result,
  error,
  onFileChange,
  onLocationChange,
  onSubmit
}: VertexModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.name.endsWith('.json')) {
      onFileChange(f)
    }
    e.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-600">V</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vertex AI</h3>
                <p className="text-sm text-gray-500">导入服务账号 JSON</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location (可选)</label>
            <input
              type="text"
              value={location}
              onChange={e => onLocationChange(e.target.value)}
              placeholder="例如: us-central1"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
            />
          </div>

          {/* File Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">服务账号 JSON</label>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            <div className="flex items-center gap-3">
              <button
                onClick={handleFileSelect}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                选择文件
              </button>
              <span className="text-sm text-gray-500 truncate flex-1">
                {file ? file.name : '未选择文件'}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                导入成功
              </div>
              <div className="space-y-1 text-sm">
                {result.project_id && <p><span className="text-gray-500">Project:</span> <span className="text-gray-900">{result.project_id}</span></p>}
                {result.email && <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{result.email}</span></p>}
                {result.location && <p><span className="text-gray-500">Location:</span> <span className="text-gray-900">{result.location}</span></p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer">
            {result ? '完成' : '取消'}
          </button>
          {!result && (
            <button
              onClick={onSubmit}
              disabled={loading || !file}
              className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              导入
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
