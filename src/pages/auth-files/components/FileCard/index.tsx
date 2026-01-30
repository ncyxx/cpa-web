/**
 * 文件卡片组件
 */

import { Bot, Eye, Download, Trash2, Loader2 } from 'lucide-react'
import type { AuthFile } from '@/services/api/authFiles'
import { formatFileSize, formatModified, getTypeColor, getTypeLabel } from '../../utils'
import { 
  getLoadRateColor, 
  getSuccessRateColorClass, 
  formatPercent 
} from '@/utils/loadRate'

interface FileCardProps {
  file: AuthFile
  isDeleting: boolean
  /** 负载率 (0-100) */
  loadRate?: number
  /** 所有文件的总请求数 */
  totalRequests?: number
  onShowModels: () => void
  onShowDetail: () => void
  onDownload: () => void
  onDelete: () => void
}

export function FileCard({
  file,
  isDeleting,
  loadRate = 0,
  totalRequests = 0,
  onShowModels,
  onShowDetail,
  onDownload,
  onDelete
}: FileCardProps) {
  const typeColor = getTypeColor(file.type || 'unknown')
  
  // 计算成功率
  const successCount = file.success_count ?? 0
  const failureCount = file.failure_count ?? 0
  const fileRequests = successCount + failureCount
  const successRate = file.success_rate ?? (fileRequests > 0 ? (successCount / fileRequests) * 100 : 100)
  const loadRateColor = getLoadRateColor(loadRate)
  const successRateClass = getSuccessRateColorClass(successRate)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* 卡片头部 */}
      <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded-md text-xs font-medium shrink-0 ${typeColor.bg} ${typeColor.text} ${typeColor.border || ''}`}>
            {getTypeLabel(file.type || 'unknown')}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate flex-1" title={file.name}>
            {file.name}
          </span>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400 text-xs">文件大小</p>
            <p className="text-gray-700 font-medium">{file.size ? formatFileSize(file.size) : '-'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">修改时间</p>
            <p className="text-gray-700 font-medium truncate" title={formatModified(file)}>
              {formatModified(file)}
            </p>
          </div>
          {file.email && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs">邮箱</p>
              <p className="text-gray-700 font-medium truncate" title={file.email}>{file.email}</p>
            </div>
          )}
        </div>
        
        {/* 负载率和成功率 */}
        {fileRequests > 0 && (
          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-50">
            {/* 负载率 */}
            <div>
              <p className="text-gray-400 text-xs mb-1">负载率</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(loadRate, 100)}%`,
                      backgroundColor: loadRateColor
                    }}
                  />
                </div>
                <span 
                  className="text-xs font-semibold min-w-[36px] text-right"
                  style={{ color: loadRateColor }}
                  title={`请求次数: ${fileRequests} / ${totalRequests}`}
                >
                  {formatPercent(loadRate)}
                </span>
              </div>
            </div>
            
            {/* 成功率 */}
            <div>
              <p className="text-gray-400 text-xs mb-1">成功率</p>
              <span 
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${successRateClass}`}
                title={`成功: ${successCount}, 失败: ${failureCount}`}
              >
                {formatPercent(successRate)} 
                <span className="opacity-70">(✓{successCount} ✗{failureCount})</span>
              </span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
          <button
            onClick={onShowModels}
            className="flex-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="查看模型"
          >
            <Bot className="w-3.5 h-3.5" />
            模型
          </button>
          <button
            onClick={onShowDetail}
            className="flex-1 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="查看详情"
          >
            <Eye className="w-3.5 h-3.5" />
            详情
          </button>
          <button
            onClick={onDownload}
            className="flex-1 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="下载"
          >
            <Download className="w-3.5 h-3.5" />
            下载
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            title="删除"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
