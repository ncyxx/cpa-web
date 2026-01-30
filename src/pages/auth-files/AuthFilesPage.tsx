/**
 * 认证文件页面
 * Bento Grid + Apple Design Style
 */

import { useRef, useMemo, type ChangeEvent } from 'react'
import {
  HeaderCard,
  FilterBar,
  FileCard,
  Pagination,
  EmptyState,
  ModelsModal,
  DetailModal,
  ExcludedModelsCard
} from './components'
import {
  useAuthFilesData,
  useAuthFilesFilter,
  useAuthFilesActions,
  useAuthFilesModals
} from './hooks'
import { getTypeLabel } from './utils'
import { useLoadRateStats } from '@/hooks'

export function AuthFilesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 数据
  const { files, setFiles, refreshing, loadFiles, totalSize } = useAuthFilesData()

  // 负载率统计
  const { stats: loadStats } = useLoadRateStats({ autoLoad: true })

  // 筛选和分页
  const {
    filter, setFilter,
    search, setSearch,
    setPage,
    filteredFiles,
    pageItems,
    totalPages,
    currentPage,
    existingTypes
  } = useAuthFilesFilter(files)
  
  // 计算所有文件的总请求数
  const totalRequests = useMemo(() => {
    return files.reduce((sum, file) => {
      const successCount = file.success_count ?? 0
      const failureCount = file.failure_count ?? 0
      return sum + successCount + failureCount
    }, 0)
  }, [files])
  
  // 计算每个文件的负载率
  const getFileLoadRate = (file: { name: string; success_count?: number; failure_count?: number }) => {
    const sourceStats = loadStats?.bySource.get(file.name)
    if (sourceStats) return sourceStats.loadRate
    const fileRequests = (file.success_count ?? 0) + (file.failure_count ?? 0)
    return totalRequests > 0 ? (fileRequests / totalRequests) * 100 : 0
  }

  // 操作
  const { uploading, deleting, handleUpload, handleDelete, handleDeleteFiltered, handleDownload } = useAuthFilesActions(
    setFiles, loadFiles, filter, filteredFiles, setFilter
  )

  // 弹窗
  const { modelsModal, detailModal, showModels, closeModels, showDetail, closeDetail } = useAuthFilesModals()

  // 文件上传处理
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <input ref={fileInputRef} type="file" accept=".json" multiple onChange={handleFileChange} className="hidden" />

      <HeaderCard
        fileCount={files.length}
        totalSize={totalSize}
        refreshing={refreshing}
        uploading={uploading}
        onRefresh={() => loadFiles(true)}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <div className="mt-6 flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <FilterBar
          existingTypes={existingTypes}
          filter={filter}
          search={search}
          filteredCount={filteredFiles.length}
          deleting={deleting}
          onFilterChange={(type) => { setFilter(type); setPage(1) }}
          onSearchChange={(value) => { setSearch(value); setPage(1) }}
          onDeleteFiltered={() => handleDeleteFiltered(getTypeLabel(filter))}
        />

        <div className="p-4 flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <EmptyState type="empty" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pageItems.map(file => (
                  <FileCard
                    key={file.name}
                    file={file}
                    isDeleting={deleting === file.name}
                    loadRate={getFileLoadRate(file)}
                    totalRequests={totalRequests}
                    onShowModels={() => showModels(file)}
                    onShowDetail={() => showDetail(file)}
                    onDownload={() => handleDownload(file)}
                    onDelete={() => handleDelete(file.name)}
                  />
                ))}
              </div>
              {totalPages > 1 && <div className="mt-4"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} /></div>}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 shrink-0"><ExcludedModelsCard existingTypes={existingTypes} /></div>

      <ModelsModal open={modelsModal.open} fileName={modelsModal.file?.name || ''} models={modelsModal.models} loading={modelsModal.loading} onClose={closeModels} />
      <DetailModal open={detailModal.open} file={detailModal.file} onClose={closeDetail} />
    </div>
  )
}
