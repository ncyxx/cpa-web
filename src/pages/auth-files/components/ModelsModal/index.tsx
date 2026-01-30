/**
 * 模型列表弹窗组件
 */

import { Loader2 } from 'lucide-react'
import { Modal } from '../Modal'

interface ModelsModalProps {
  open: boolean
  fileName: string
  models: any[]
  loading: boolean
  onClose: () => void
}

export function ModelsModal({ open, fileName, models, loading, onClose }: ModelsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`模型列表 - ${fileName}`}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无模型数据或不支持此功能</div>
      ) : (
        <div className="space-y-2">
          {models.map((model, idx) => (
            <div key={idx} className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-900">{model.id || model.display_name}</p>
              {model.type && <p className="text-xs text-gray-500 mt-0.5">类型: {model.type}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
