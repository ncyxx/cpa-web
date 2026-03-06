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
    <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="bg-gradient-to-r from-violet-50 via-white to-orange-50 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-violet-600 to-orange-500 shadow-lg shadow-violet-200/80">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">认证文件</h2>
              <p className="mt-1 text-xs text-slate-600">
                当前管理 <span className="font-semibold text-slate-900">{fileCount}</span> 个文件
                <span className="mx-2 text-slate-300">/</span>
                总大小 <span className="font-semibold text-slate-900">{formatFileSize(totalSize)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-violet-200 hover:text-violet-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onUploadClick}
              disabled={uploading}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-3.5 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              上传文件
            </button>
          </div>
        </div>

        <div className="grid gap-2.5 border-t border-white/80 pt-4 sm:grid-cols-2 lg:max-w-md lg:grid-cols-2">
          <div className="rounded-2xl border border-violet-100 bg-white/90 px-3.5 py-2.5">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-violet-500">文件总数</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{fileCount}</div>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white/90 px-3.5 py-2.5">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-500">存储体积</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{formatFileSize(totalSize)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
