/**
 * 文件卡片组件
 */

import { Bot, CheckCircle2, Download, Eye, Loader2, Trash2 } from 'lucide-react'
import type { AuthFile } from '@/services/api/authFiles'
import { formatFileSize, formatModified, getTypeColor, getTypeLabel } from '../../utils'
import { formatPercent, type AccountLoadStats } from '@/utils/loadRate'

interface FileCardProps {
  file: AuthFile
  isDeleting: boolean
  statusUpdating: boolean
  selectionMode: boolean
  selected: boolean
  stats?: AccountLoadStats | null
  loadRate?: number
  totalRequests?: number
  onSelectChange: (checked: boolean) => void
  onToggleEnabled: (nextEnabled: boolean) => void
  onShowModels: () => void
  onShowDetail: () => void
  onDownload: () => void
  onDelete: () => void
}

function getStatusLabel(file: AuthFile): string {
  const status = (file.status || '').trim().toLowerCase()
  if (file.disabled) return '禁用'
  if (file.unavailable) return '不可用'
  if (status === 'error' || status === 'invalid' || status === 'failed') return '错误'
  if (status === 'active' || status === 'ok' || status === 'ready') return '有效'
  return file.status || '未知'
}

function getStatusTone(file: AuthFile): string {
  const status = (file.status || '').trim().toLowerCase()
  if (file.disabled) return 'border-slate-200 bg-slate-100 text-slate-700'
  if (file.unavailable) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'error' || status === 'invalid' || status === 'failed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export function FileCard({
  file,
  isDeleting,
  statusUpdating,
  selectionMode,
  selected,
  stats,
  onSelectChange,
  onToggleEnabled,
  onShowModels,
  onShowDetail,
  onDownload,
  onDelete
}: FileCardProps) {
  const providerTone = getTypeColor(file.type || 'unknown')
  const displayName = file.email || file.label || file.account || file.name
  const enabled = !file.disabled
  const successRate = stats?.successRate
  const requestCount = stats?.totalRequests

  return (
    <article className={`group overflow-hidden rounded-[20px] border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${selected ? 'border-violet-300 ring-4 ring-violet-100' : 'border-slate-200'}`}>
      <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {selectionMode ? (
              <label className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-violet-200 bg-violet-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelectChange(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded border-violet-300 text-violet-600 focus:ring-violet-500/30"
                />
              </label>
            ) : (
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-violet-400" />
            )}
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${providerTone.bg} ${providerTone.text} ${providerTone.border || ''}`}>
              {getTypeLabel(file.type || 'unknown')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusTone(file)}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {getStatusLabel(file)}
            </span>
            <button
              type="button"
              onClick={() => onToggleEnabled(!enabled)}
              disabled={statusUpdating}
              className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              title={enabled ? '点击禁用配置' : '点击启用配置'}
              aria-label={enabled ? '禁用配置' : '启用配置'}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
              {statusUpdating ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-slate-950" title={displayName}>{displayName}</h3>
          <p className="mt-1 truncate font-mono text-[11px] text-slate-500" title={file.name}>{file.name}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">文件大小</div>
            <div className="mt-1 text-sm font-semibold text-slate-950">{file.size ? formatFileSize(file.size) : '-'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">修改时间</div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-950">{formatModified(file)}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            请求 {typeof requestCount === 'number' ? requestCount.toLocaleString() : '-'}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            成功率 {typeof successRate === 'number' ? formatPercent(successRate) : '-'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
          <button
            onClick={onShowModels}
            disabled={statusUpdating}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-violet-50 px-3 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50 cursor-pointer"
            title="查看模型"
          >
            <Bot className="h-3.5 w-3.5" />
            模型
          </button>
          <button
            onClick={onShowDetail}
            disabled={statusUpdating}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
            title="查看详情"
          >
            <Eye className="h-3.5 w-3.5" />
            详情
          </button>
          <button
            onClick={onDownload}
            disabled={statusUpdating}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-cyan-50 px-3 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 disabled:opacity-50 cursor-pointer"
            title="下载"
          >
            <Download className="h-3.5 w-3.5" />
            下载
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting || statusUpdating}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-red-50 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
            title="删除"
          >
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            删除
          </button>
        </div>
      </div>
    </article>
  )
}
