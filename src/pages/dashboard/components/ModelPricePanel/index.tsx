/**
 * 模型价格设置面板
 * 横向Tab切换模型系列，点击显示对应模型列表
 */

import { useState, useEffect, useCallback } from 'react'
import { X, DollarSign } from 'lucide-react'
import { MODEL_SERIES_CONFIG, MODEL_SERIES_ORDER } from '../../models/seriesConfig'
import { loadModelPrices, saveModelPrices, type ModelPrice } from '@/utils/usage'

interface ModelPricePanelProps {
  open: boolean
  onClose: () => void
  onSave?: () => void
}

// 单个模型价格输入 - 简洁行样式，自动保存
function ModelPriceInput({
  model,
  price,
  onChange
}: {
  model: string
  price: ModelPrice | undefined
  onChange: (model: string, price: ModelPrice | null) => void
}) {
  const [prompt, setPrompt] = useState(price?.prompt?.toString() || '')
  const [completion, setCompletion] = useState(price?.completion?.toString() || '')
  const [cache, setCache] = useState(price?.cache?.toString() || '')

  useEffect(() => {
    setPrompt(price?.prompt?.toString() || '')
    setCompletion(price?.completion?.toString() || '')
    setCache(price?.cache?.toString() || '')
  }, [price])

  const handleBlur = () => {
    const p = parseFloat(prompt) || 0
    const c = parseFloat(completion) || 0
    const ca = parseFloat(cache) || p
    if (p > 0 || c > 0) {
      onChange(model, { prompt: p, completion: c, cache: ca })
    } else {
      onChange(model, null) // 清空价格
    }
  }

  const hasPrice = price && (price.prompt > 0 || price.completion > 0)

  return (
    <div className={`grid grid-cols-[1fr_100px_100px_100px_32px] gap-3 items-center px-3 py-2.5 rounded-lg transition-colors ${
      hasPrice ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      <span className="text-sm font-medium text-gray-700 truncate text-center" title={model}>
        {model}
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={completion}
        onChange={(e) => setCompletion(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={cache}
        onChange={(e) => setCache(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-2.5 py-1.5 text-sm text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      <div className="flex justify-center">
        {hasPrice ? (
          <span className="w-2 h-2 rounded-full bg-green-500" title="已配置" />
        ) : (
          <div className="w-4" />
        )}
      </div>
    </div>
  )
}

export function ModelPricePanel({ open, onClose, onSave }: ModelPricePanelProps) {
  const [prices, setPrices] = useState<Record<string, ModelPrice>>({})
  const [activeSeries, setActiveSeries] = useState<string>(MODEL_SERIES_ORDER[0])

  // ESC关闭 + 禁止body滚动
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      setPrices(loadModelPrices())
    }
  }, [open])

  // 自动保存：失焦时直接保存到localStorage
  const handleChange = useCallback((model: string, price: ModelPrice | null) => {
    setPrices(prev => {
      const next = { ...prev }
      if (price) {
        next[model] = price
      } else {
        delete next[model]
      }
      // 立即保存到localStorage
      saveModelPrices(next)
      onSave?.()
      return next
    })
  }, [onSave])

  const configuredTotal = Object.values(prices).filter(p => p.prompt > 0 || p.completion > 0).length
  const activeConfig = MODEL_SERIES_CONFIG[activeSeries]
  const activeModels = activeConfig?.models || []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* 模态框 - 固定大小 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">模型价格设置</h3>
              <p className="text-xs text-gray-500">
                已配置 {configuredTotal} 个模型 · 价格单位: $/1M tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 横向Tab菜单 - 两行排列 */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-6 gap-1.5">
            {MODEL_SERIES_ORDER.map(seriesKey => {
              const config = MODEL_SERIES_CONFIG[seriesKey]
              if (!config || !config.models?.length) return null
              const count = config.models.filter(m => prices[m] && (prices[m].prompt > 0 || prices[m].completion > 0)).length
              const isActive = activeSeries === seriesKey
              
              return (
                <button
                  key={seriesKey}
                  onClick={() => setActiveSeries(seriesKey)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg transition-all cursor-pointer text-xs font-medium ${
                    isActive 
                      ? 'bg-gray-900 text-white shadow-sm' 
                      : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {config.icon}
                  </div>
                  <span className="truncate">{config.title}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1 rounded-full shrink-0 ${
                      isActive ? 'bg-white/20' : 'bg-green-100 text-green-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 表头 - 固定不滚动 */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-white">
          <div className="grid grid-cols-[1fr_100px_100px_100px_32px] gap-3 items-center px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span className="text-center">模型名称</span>
            <span className="text-center">输入 $/1M</span>
            <span className="text-center">输出 $/1M</span>
            <span className="text-center">缓存 $/1M</span>
            <span></span>
          </div>
        </div>

        {/* 模型列表 - 可滚动 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1.5">
            {activeModels.map(model => (
              <ModelPriceInput
                key={model}
                model={model}
                price={prices[model]}
                onChange={handleChange}
              />
            ))}
          </div>
          
          {activeModels.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              该系列暂无模型
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
