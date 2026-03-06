/**
 * 文件详情弹窗组件
 */

import { AlertTriangle, Ban, CheckCircle2, Download, Eye, Loader2, Power, PowerOff, Trash2, XCircle } from 'lucide-react'
import type { AuthFile } from '@/services/api/authFiles'
import { Modal } from '../Modal'
import { formatFileSize, formatModified, getTypeColor, getTypeLabel } from '../../utils'

interface DetailModalProps {
  open: boolean
  file: AuthFile | null
  statusUpdating?: boolean
  onClose: () => void
  onToggleEnabled: (nextEnabled: boolean) => void
  onShowModels: () => void
  onDownload: () => void
  onDelete: () => void
}

function getStatusMeta(file: AuthFile) {
  const status = (file.status || '').trim().toLowerCase()
  if (file.disabled) return { label: '禁用', tone: 'border-slate-200 bg-slate-100 text-slate-700', icon: <Ban className="h-4 w-4" /> }
  if (file.unavailable) return { label: '不可用', tone: 'border-amber-200 bg-amber-50 text-amber-700', icon: <AlertTriangle className="h-4 w-4" /> }
  if (status === 'error' || status === 'invalid' || status === 'failed') return { label: '错误', tone: 'border-red-200 bg-red-50 text-red-700', icon: <XCircle className="h-4 w-4" /> }
  return { label: '有效', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: <CheckCircle2 className="h-4 w-4" /> }
}

function formatDateTime(value?: string | number): string {
  if (value === undefined || value === null || value === '') return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN', { hour12: false })
}

function getPlanType(file: AuthFile): string {
  const planType = file.id_token && typeof file.id_token === 'object'
    ? (file.id_token['plan_type'] as string | undefined)
    : undefined
  if (planType) return planType
  if (file.name.endsWith('-team.json')) return 'team'
  return '-'
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function ActionButton({ icon, label, tone, onClick, loading }: { icon: React.ReactNode; label: string; tone: 'violet' | 'blue' | 'cyan' | 'red'; onClick: () => void; loading?: boolean }) {
  const toneClass = {
    violet: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
    red: 'bg-red-50 text-red-700 hover:bg-red-100'
  }[tone]

  return (
    <button onClick={onClick} className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition-colors cursor-pointer ${toneClass}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  )
}

export function DetailModal({ open, file, statusUpdating = false, onClose, onToggleEnabled, onShowModels, onDownload, onDelete }: DetailModalProps) {
  if (!file) return null

  const displayName = (file.email || '').trim() || file.label || file.name
  const providerTone = getTypeColor(file.type || 'unknown')
  const plan = getPlanType(file)
  const statusMeta = getStatusMeta(file)
  const enabled = !file.disabled

  return (
    <Modal open={open} onClose={onClose} title="配置详情" panelClassName="max-w-5xl" bodyClassName="p-0">
      <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-orange-50 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${providerTone.bg} ${providerTone.text} ${providerTone.border || ''}`}>
                    {getTypeLabel(file.type || 'unknown')}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.tone}`}>
                    {statusMeta.icon}
                    {statusMeta.label}
                  </span>
                  {plan !== '-' ? <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium uppercase text-slate-700">{plan}</span> : null}
                </div>
                <h2 className="mt-4 break-all text-3xl font-semibold tracking-tight text-slate-950">{displayName}</h2>
                <p className="mt-2 break-all font-mono text-sm text-slate-500">{file.name}</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">账号开关</div>
                <button
                  type="button"
                  onClick={() => onToggleEnabled(!enabled)}
                  disabled={statusUpdating}
                  className="mt-3 flex items-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <span className={`relative h-8 w-14 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    {statusUpdating ? <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white" /></span> : null}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{enabled ? '当前已启用' : '当前已禁用'}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Metric label="文件大小" value={file.size ? formatFileSize(file.size) : '-'} />
              <Metric label="修改时间" value={formatModified(file)} />
              <Metric label="创建时间" value={formatDateTime(file.created_at)} />
              <Metric label="更新时间" value={formatDateTime(file.updated_at || file.modTime || file.modtime)} />
              <Metric label="提供商" value={file.provider || '-'} />
              <Metric label="来源" value={file.source || '-'} />
            </div>

            {file.status_message ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">状态信息</div>
                <div className="mt-1 break-all">{file.status_message}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bg-slate-50/70 p-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">快速操作</div>
            <div className="mt-4 grid gap-3">
              <ActionButton icon={<Eye className="h-4 w-4" />} label="查看模型" tone="violet" onClick={onShowModels} />
              <ActionButton icon={<Download className="h-4 w-4" />} label="下载配置" tone="cyan" onClick={onDownload} />
              <ActionButton icon={enabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />} label={enabled ? '禁用配置' : '启用配置'} tone="blue" onClick={() => onToggleEnabled(!enabled)} loading={statusUpdating} />
              <ActionButton icon={<Trash2 className="h-4 w-4" />} label="删除配置" tone="red" onClick={onDelete} />
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">展示说明</div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <p>摘要卡只保留快速识别信息，详细操作与完整状态统一放到这个大卡里。</p>
              <p>这样列表页一次能看到更多账号，具体配置再按需展开，不会被小卡片挤压。</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
