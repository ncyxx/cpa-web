/**
 * Vertex AI 卡片 - 只显示基本信息和按钮
 */

import { Loader2, CheckCircle } from 'lucide-react'
import type { VertexImportResponse } from '@/services/api/oauth'
import iconVertex from '@/assets/icons/vertex.svg'

interface VertexCardProps {
  loading: boolean
  result: VertexImportResponse | null
  onOpenModal: () => void
}

export function VertexCard({ loading, result, onOpenModal }: VertexCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col justify-center">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <img src={iconVertex} alt="Vertex AI" className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">Vertex AI</h3>
            <p className="text-xs text-gray-500 mt-0.5">导入服务账号 JSON</p>
          </div>
        </div>
        
        {result ? (
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium shrink-0 ml-3">
            <CheckCircle className="w-4 h-4" />
            已导入
          </div>
        ) : (
          <button
            onClick={onOpenModal}
            disabled={loading}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-3"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            导入
          </button>
        )}
      </div>
    </div>
  )
}
