/**
 * 空状态和加载状态组件
 */

import { FileText } from 'lucide-react'

interface LoadingStateProps {
  type: 'loading' | 'empty'
}

export function EmptyState({ type }: LoadingStateProps) {
  if (type === 'loading') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-8 flex flex-col items-center">
        <div className="w-8 h-8 border-3 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm mt-3">正在加载...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 text-base font-medium">暂无认证文件</p>
      <p className="text-gray-400 text-sm mt-1">点击上方按钮上传 JSON 文件</p>
    </div>
  )
}
