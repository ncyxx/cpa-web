/**
 * 头部统计卡片组件
 */

import { FileText, Upload, RefreshCw, Loader2 } from 'lucide-react'
import { formatFileSize } from '../../utils'

interface HeaderCardProps {
  fileCount: number
  totalSize: number
  refreshing: boolean
  uploading: boolean
  onRefresh: () => void
  onUploadClick: () => void
}

export function HeaderCard({
  fileCount,
  totalSize,
  refreshing,
  uploading,
  onRefresh,
  onUploadClick
}: HeaderCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">认证文件</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              共 <span className="font-medium text-gray-700">{fileCount}</span> 个文件，
              总大小 <span className="font-medium text-gray-700">{formatFileSize(totalSize)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onUploadClick}
            disabled={uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            上传文件
          </button>
        </div>
      </div>
    </div>
  )
}
