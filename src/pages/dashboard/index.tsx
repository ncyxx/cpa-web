/**
 * Dashboard 页面
 * Bento Grid Style - Apple Design System
 * 模块化架构 - Feature-Sliced Design
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useConfigStore } from '@/stores'
import { ConnectionCard, ModelStatsCard, ModelSeriesModal, StatsContainer } from './components'
import { useDashboardData } from './hooks'
import { MODEL_SERIES_CONFIG, MODEL_SERIES_ORDER } from './models'

export function DashboardPage() {
  const config = useConfigStore((state) => state.config)
  const { connectionStatus, apiBase, serverVersion, stats, usageStats, providerData, modelSeriesData, loading, refreshing, refresh } = useDashboardData()

  const totalProviders = Object.values(providerData).reduce((sum, p) => sum + p.total, 0)

  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(0)
  const lastWheelTime = useRef(0)

  // 显示所有模型系列，有数据的显示统计，没数据的显示 0
  const allModelSeries = MODEL_SERIES_ORDER.map(key => ({
    key,
    data: modelSeriesData[key] || { requests: 0, success: 0, failure: 0, tokens: 0 }
  }))

  // 分组：每组2个
  const groups = useMemo(() => {
    const result: typeof allModelSeries[] = []
    for (let i = 0; i < allModelSeries.length; i += 2) {
      result.push(allModelSeries.slice(i, i + 2))
    }
    return result
  }, [allModelSeries])

  const totalPages = groups.length

  // 鼠标滚轮翻页
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const now = Date.now()
    // 防抖：300ms 内只响应一次
    if (now - lastWheelTime.current < 300) return
    lastWheelTime.current = now

    if (e.deltaY > 0) {
      // 向下滚动 -> 下一页
      setCurrentPage(p => Math.min(totalPages - 1, p + 1))
    } else if (e.deltaY < 0) {
      // 向上滚动 -> 上一页
      setCurrentPage(p => Math.max(0, p - 1))
    }
  }, [totalPages])

  // 从 usageStats 中提取每个模型的使用数据
  const modelUsageData = useMemo(() => {
    const data: Record<string, { name: string; requests: number; success: number; failure: number; tokens: number }> = {}
    if (usageStats?.apis) {
      Object.values(usageStats.apis).forEach((apiData: any) => {
        if (apiData.models) {
          Object.entries(apiData.models).forEach(([modelName, modelData]: [string, any]) => {
            if (!data[modelName]) {
              data[modelName] = {
                name: modelName,
                requests: 0,
                success: 0,
                failure: 0,
                tokens: 0
              }
            }
            
            const totalRequests = modelData.total_requests || 0
            const totalTokens = modelData.total_tokens || 0
            
            // 从 details 数组中计算成功/失败统计
            let successCount = 0
            let failureCount = 0
            
            if (Array.isArray(modelData.details)) {
              modelData.details.forEach((detail: any) => {
                if (detail?.failed === true) {
                  failureCount++
                } else {
                  successCount++
                }
              })
            } else {
              // 如果没有 details，假设全部成功
              successCount = totalRequests
            }
            
            data[modelName].requests += totalRequests
            data[modelName].success += successCount
            data[modelName].failure += failureCount
            data[modelName].tokens += totalTokens
          })
        }
      })
    }
    return data
  }, [usageStats])

  // 打开模态框
  const handleDetailClick = (seriesKey: string) => {
    setSelectedSeries(seriesKey)
    setModalOpen(true)
  }

  // 获取选中系列的配置
  const selectedConfig = selectedSeries ? MODEL_SERIES_CONFIG[selectedSeries] : null

  // 当前页的卡片
  const currentGroup = groups[currentPage] || []

  return (
    <div className="space-y-4">
      {/* 连接状态 + 配置 */}
      <ConnectionCard
        connectionStatus={connectionStatus}
        apiBase={apiBase}
        serverVersion={serverVersion}
        config={config}
        loading={loading || refreshing}
        onRefresh={refresh}
      />

      {/* 8个统计卡片 */}
      <StatsContainer
        stats={stats}
        totalProviders={totalProviders}
        usageStats={usageStats}
        loading={loading}
      />

      {/* 模型系列统计卡片 - 分页展示，每页2个 */}
      <div 
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" 
        style={{ height: 'calc(100vh - 480px)', minHeight: '300px' }}
        onWheel={handleWheel}
      >
        {/* Header + 分页控制 */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">模型系列统计</h3>
            <p className="text-xs text-gray-500 mt-0.5">按供应商分类的模型使用情况</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 min-w-[3rem] text-center">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 内容区 - 当前页的2个卡片 */}
        <div className="flex-1 p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-4 py-3 bg-gray-100/50 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-28 bg-gray-200 rounded mt-1.5 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-14 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 h-full">
              {currentGroup.map(({ key, data }) => {
                const cfg = MODEL_SERIES_CONFIG[key] || MODEL_SERIES_CONFIG.other
                return (
                  <ModelStatsCard
                    key={key}
                    title={cfg.title}
                    sub={cfg.sub}
                    icon={cfg.icon}
                    bg={cfg.bg}
                    color={cfg.color}
                    headerBg={cfg.headerBg}
                    data={data}
                    models={cfg.models}
                    onDetailClick={() => handleDetailClick(key)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* 底部分页指示器 */}
        <div className="px-5 pb-3 flex items-center justify-center gap-1.5 shrink-0">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                index === currentPage 
                  ? 'w-6 bg-blue-500' 
                  : 'w-1.5 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 模型系列详情模态框 */}
      {selectedConfig && (
        <ModelSeriesModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedConfig.title}
          sub={selectedConfig.sub}
          icon={selectedConfig.icon}
          bg={selectedConfig.bg}
          color={selectedConfig.color}
          models={selectedConfig.models || []}
          usageData={modelUsageData}
        />
      )}
    </div>
  )
}
