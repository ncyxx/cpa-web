/**
 * 文件详情弹窗组件
 */

import type { AuthFile } from '@/services/api/authFiles'
import { Modal } from '../Modal'
import { formatFileSize, formatModified, getTypeLabel } from '../../utils'

interface DetailModalProps {
  open: boolean
  file: AuthFile | null
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 break-all">{value}</span>
    </div>
  )
}

export function DetailModal({ open, file, onClose }: DetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`文件详情 - ${file?.name || ''}`}>
      {file && (
        <div className="space-y-4">
          <DetailRow label="文件名" value={file.name} />
          <DetailRow label="类型" value={getTypeLabel(file.type || 'unknown')} />
          <DetailRow label="提供商" value={file.provider || '-'} />
          <DetailRow label="邮箱" value={file.email || '-'} />
          <DetailRow label="账户ID" value={file.accountId || '-'} />
          <DetailRow label="文件大小" value={file.size ? formatFileSize(file.size) : '-'} />
          <DetailRow label="修改时间" value={formatModified(file)} />
        </div>
      )}
    </Modal>
  )
}
