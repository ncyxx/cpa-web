/**
 * 模型系列详情模态框
 * 显示该系列所有模型的使用统计
 * 进度条样式：绿色成功，红色失败
 */

import { X, Activity, Zap } from 'lucide-react'
import { useEffect } from 'react'

interface ModelUsageData {
  name: string
  requests: number
  success: number
  failure: number
  tokens: number
}

interface ModelSeriesModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  models: string[]
  usageData: Record<string, ModelUsageData>
}

export function ModelSeriesModal({
  isOpen,
  onClose,
  title,
  sub,
  icon,
  bg,
  color,
  models,
  usageData
}: ModelSeriesModalProps) {
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

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toLocaleString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        <div className={`px-6 py-4 bg-gradient-to-r from-${bg.replace('bg-', '')}/30 to-white border-b border-gray-100`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                {icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{sub}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-3">
            {models.map((modelName) => {
              const data = usageData[modelName]
              const hasData = data && data.requests > 0
              const successRate = hasData ? Math.round((data.success / data.requests) * 100) : 0
              const failureRate = hasData ? 100 - successRate : 0

              return (
                <div 
                  key={modelName}
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasData ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-900 font-mono truncate">{modelName}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="font-semibold text-gray-900">{hasData ? formatNumber(data.requests) : 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="font-semibold text-gray-900">{hasData ? formatNumber(data.tokens) : 0}</span>
                      </div>
                      {hasData && (
                        <span className={`text-xs font-semibold min-w-[40px] text-right ${successRate >= 90 ? 'text-green-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {successRate}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    {hasData ? (
                      <div className="h-full flex">
                        <div 
                          className="bg-green-500 transition-all duration-300"
                          style={{ width: `${successRate}%` }}
                        />
                        <div 
                          className="bg-red-500 transition-all duration-300"
                          style={{ width: `${failureRate}%` }}
                        />
                      </div>
                    ) : (
                      <div className="h-full bg-gray-200" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {models.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无模型数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
