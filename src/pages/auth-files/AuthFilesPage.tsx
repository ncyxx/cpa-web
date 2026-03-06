/**
 * 认证文件页面
 */

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { ChevronDown, CheckCheck, LayoutPanelTop, ListChecks, Loader2, Power, PowerOff, Trash2, X } from 'lucide-react'
import {
  HeaderCard,
  FilterBar,
  FileCard,
  Pagination,
  EmptyState,
  ModelsModal,
  DetailModal,
  ExcludedModelsCard,
  Modal
} from './components'
import {
  useAuthFilesData,
  useAuthFilesFilter,
  useAuthFilesActions,
  useAuthFilesModals
} from './hooks'
import { useLoadRateStats } from '@/hooks'
import type { AccountLoadStats } from '@/utils/loadRate'

interface ControlTileProps {
  icon: ReactNode
  title: string
  subtitle: string
  tone: 'violet' | 'cyan' | 'emerald'
  active: boolean
  onClick: () => void
  disabled?: boolean
  meta?: string
}

interface DrawerActionButtonProps {
  label: string
  onClick: () => void
  icon: ReactNode
  disabled?: boolean
  tone?: 'default' | 'danger'
}

const controlToneClass: Record<ControlTileProps['tone'], { card: string; switchOn: string; icon: string }> = {
  violet: {
    card: 'border-violet-200 bg-violet-50/80 text-violet-900',
    switchOn: 'bg-violet-500',
    icon: 'bg-violet-100 text-violet-700'
  },
  cyan: {
    card: 'border-cyan-200 bg-cyan-50/80 text-cyan-900',
    switchOn: 'bg-cyan-500',
    icon: 'bg-cyan-100 text-cyan-700'
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    switchOn: 'bg-emerald-500',
    icon: 'bg-emerald-100 text-emerald-700'
  }
}

function ControlTile({ icon, title, subtitle, tone, active, onClick, disabled, meta }: ControlTileProps) {
  const palette = controlToneClass[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[88px] items-center justify-between gap-4 rounded-[20px] border px-3.5 py-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 cursor-pointer ${
        active ? `${palette.card} shadow-sm` : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${active ? palette.icon : 'bg-slate-100 text-slate-600'}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{title}</div>
            {meta ? <div className="mt-0.5 text-xs text-slate-500">{meta}</div> : null}
          </div>
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</div>
      </div>

      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? palette.switchOn : 'bg-slate-300'}`}>
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </span>
    </button>
  )
}

function DrawerActionButton({ label, onClick, icon, disabled, tone = 'default' }: DrawerActionButtonProps) {
  const toneClass = tone === 'danger'
    ? 'bg-red-50 text-red-700 hover:bg-red-100'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${toneClass}`}
    >
      {icon}
      {label}
    </button>
  )
}

export function AuthFilesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { files, setFiles, refreshing, loadFiles, totalSize } = useAuthFilesData()
  const { stats: loadStats } = useLoadRateStats({ autoLoad: true })

  const {
    filter, setFilter,
    search, setSearch,
    setPage,
    filteredFiles,
    pageItems,
    totalPages,
    currentPage,
    existingTypes,
    typeCounts
  } = useAuthFilesFilter(files)

  const getFileStats = (file: { name: string; auth_index?: string | number }): AccountLoadStats | null => {
    const sourceStats = loadStats?.bySource.get(file.name)
    if (sourceStats) return sourceStats
    const authIndex = file.auth_index
    if (authIndex !== undefined && authIndex !== null) {
      return loadStats?.byAuthIndex.get(String(authIndex)) ?? null
    }
    return null
  }

  const { uploading, deleting, statusUpdating, handleUpload, handleDelete, handleSetDisabled, handleDeleteSelected, handleDownload } = useAuthFilesActions(
    setFiles, loadFiles, filter, filteredFiles, setFilter
  )

  const { modelsModal, detailModal, showModels, closeModels, showDetail, closeDetail } = useAuthFilesModals()
  const [oauthConfigOpen, setOauthConfigOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [selectAllActive, setSelectAllActive] = useState(false)

  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const selectedList = useMemo(() => Array.from(selectedNames), [selectedNames])
  const selectedCount = selectedList.length
  const filteredNames = useMemo(() => filteredFiles.map((file) => file.name), [filteredFiles])
  const allFilteredSelected = filteredNames.length > 0 && filteredNames.every((name) => selectedNames.has(name))
  const enabledCount = filteredFiles.filter((file) => !file.disabled).length
  const showBottomActionBar = selectionMode && selectedCount > 0 && !oauthConfigOpen && !controlsOpen
  const showDrawerSelectionOverlay = selectionMode && controlsOpen
  const drawerCardShellClassName = pageItems.length === 1
    ? 'w-full max-w-[360px]'
    : pageItems.length === 2
      ? 'w-full max-w-[760px]'
      : 'w-full'
  const drawerCardGridClassName = pageItems.length === 1
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 gap-4 xl:grid-cols-2'

  useEffect(() => {
    const fileNames = new Set(files.map((file) => file.name))
    setSelectedNames((prev) => {
      const next = new Set(Array.from(prev).filter((name) => fileNames.has(name)))
      return next.size === prev.size ? prev : next
    })
  }, [files])

  useEffect(() => {
    if (!selectionMode) {
      setSelectedNames(new Set())
      setSelectAllActive(false)
    }
  }, [selectionMode])

  useEffect(() => {
    if (!filteredNames.length) {
      setSelectAllActive(false)
      return
    }
    if (selectAllActive && !allFilteredSelected) {
      setSelectAllActive(false)
    }
  }, [allFilteredSelected, filteredNames.length, selectAllActive])

  const handleSelectChange = (name: string, checked: boolean) => {
    if (!selectionMode) return
    setSelectedNames((prev) => {
      const next = new Set(prev)
      if (checked) next.add(name)
      else next.delete(name)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedNames(new Set())
    setSelectAllActive(false)
  }

  const handleDeleteSelectedClick = async () => {
    const ok = await handleDeleteSelected(selectedList)
    if (ok) clearSelection()
  }

  const handleSelectAllFiltered = () => {
    if (!filteredNames.length) return
    setSelectedNames((prev) => {
      const next = new Set(prev)
      filteredNames.forEach((name) => next.add(name))
      return next
    })
  }

  const handleUnselectAllFiltered = () => {
    if (!filteredNames.length) return
    setSelectedNames((prev) => {
      const next = new Set(prev)
      filteredNames.forEach((name) => next.delete(name))
      return next
    })
    setSelectAllActive(false)
  }

  const handleToggleSelectAll = () => {
    if (!filteredFiles.length) return
    if (!selectionMode) {
      setSelectionMode(true)
    }
    if (selectAllActive && allFilteredSelected) {
      handleUnselectAllFiltered()
      return
    }
    handleSelectAllFiltered()
    setSelectAllActive(true)
  }

  const handleToggleAllEnabled = async () => {
    if (!filteredFiles.length || bulkStatusUpdating) return
    const nextAllEnabled = enabledCount !== filteredFiles.length
    const targets = filteredFiles.filter((file) => (nextAllEnabled ? !!file.disabled : !file.disabled))
    if (!targets.length) return

    setBulkStatusUpdating(true)
    try {
      for (const file of targets) {
        await handleSetDisabled(file.name, !nextAllEnabled, { sync: false })
      }
      await loadFiles(true)
    } finally {
      setBulkStatusUpdating(false)
    }
  }

  const handleSetSelectedDisabled = async (disabled: boolean) => {
    if (!selectedList.length || bulkStatusUpdating) return
    const selectedNameSet = new Set(selectedList)
    const targets = files.filter((file) => selectedNameSet.has(file.name) && file.disabled !== disabled)
    if (!targets.length) return

    setBulkStatusUpdating(true)
    try {
      for (const file of targets) {
        await handleSetDisabled(file.name, disabled, { sync: false })
      }
      await loadFiles(true)
    } finally {
      setBulkStatusUpdating(false)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 pb-6">
      <input ref={fileInputRef} type="file" accept=".json" multiple onChange={handleFileChange} className="hidden" />

      <HeaderCard
        fileCount={files.length}
        totalSize={totalSize}
        refreshing={refreshing}
        uploading={uploading}
        onRefresh={() => loadFiles(true)}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_36px_rgba(15,23,42,0.05)]">
        <FilterBar
          existingTypes={existingTypes}
          typeCounts={typeCounts}
          filter={filter}
          search={search}
          onFilterChange={(type) => {
            setFilter(type)
            setPage(1)
          }}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          onOpenOAuthConfig={() => setOauthConfigOpen(true)}
        />

        <div className="p-4 lg:p-5">
          <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50/80 px-3.5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <LayoutPanelTop className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-slate-950">批量管理面板</div>
                <div className="mt-1 text-xs text-slate-500">账号卡片和批量开关都收进左侧管理面板，列表页外层不再重复展示。</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-slate-500">当前筛选 {filteredFiles.length} 项 / 已选 {selectedCount} 项</div>
              <button
                type="button"
                onClick={() => setControlsOpen(true)}
                disabled={!filteredFiles.length}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                打开批量管理
                <ChevronDown className="h-4 w-4 -rotate-90 text-white/80" />
              </button>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="mt-6">
              <EmptyState type="empty" embedded />
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
              <div className="mx-auto max-w-xl">
                <div className="text-sm font-semibold text-slate-900">账号卡片已收纳进批量管理面板</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">点击右侧主按钮进入左侧工作台，在里面统一查看账号卡片、批量开关和分页。</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {showBottomActionBar ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-[1040px] rounded-[22px] border border-slate-200 bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                已选 <span className="font-semibold text-slate-950">{selectedCount}</span>
                <span className="mx-2 text-slate-300">/</span>
                当前筛选 <span className="font-semibold text-slate-950">{filteredFiles.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={allFilteredSelected ? handleUnselectAllFiltered : handleSelectAllFiltered}
                  disabled={!!deleting}
                  className="inline-flex h-10 items-center gap-1 rounded-2xl border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  {allFilteredSelected ? '取消当前全选' : '全部选中'}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={!!deleting}
                  className="inline-flex h-10 items-center gap-1 rounded-2xl border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  取消选择
                </button>
                <button
                  onClick={handleDeleteSelectedClick}
                  disabled={!!deleting || selectedCount === 0}
                  className="inline-flex h-10 items-center gap-1 rounded-2xl bg-red-50 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除选中 ({selectedCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        title="批量管理面板"
        variant="drawer-left"
        panelClassName="max-w-[min(1180px,96vw)]"
        bodyClassName="p-0"
      >
        <div className="flex h-full min-h-0 flex-col bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <LayoutPanelTop className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-lg font-semibold text-slate-950">全局批量管理</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">左侧处理批量操作，右侧直接查看账号摘要卡，不用来回切换页面。</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-violet-100 bg-white/90 px-3.5 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet-500">当前筛选</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{filteredFiles.length}</div>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-white/90 px-3.5 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-500">已选项</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{selectedCount}</div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white/90 px-3.5 py-2.5">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-500">已启用</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">{enabledCount}</div>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="border-b border-slate-100 bg-slate-50/60 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="space-y-3">
                <ControlTile
                  icon={<ListChecks className="h-4 w-4" />}
                  title="选中模式"
                  subtitle={selectionMode ? '复选框已显示，可直接选择右侧卡片。' : '开启后显示复选框，并启用批量操作。'}
                  tone="violet"
                  active={selectionMode}
                  onClick={() => setSelectionMode((prev) => !prev)}
                  meta={selectionMode ? `已选 ${selectedCount} 项` : '未开启'}
                />
                <ControlTile
                  icon={<CheckCheck className="h-4 w-4" />}
                  title="全选当前筛选"
                  subtitle={filteredFiles.length ? '按当前标签与搜索结果一键全选或取消。' : '当前筛选结果为空。'}
                  tone="cyan"
                  active={selectAllActive && filteredFiles.length > 0}
                  onClick={handleToggleSelectAll}
                  disabled={!filteredFiles.length}
                  meta={`当前结果 ${filteredFiles.length} 项`}
                />
                <ControlTile
                  icon={bulkStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : enabledCount === filteredFiles.length && filteredFiles.length > 0 ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  title="全部开关"
                  subtitle={filteredFiles.length ? '对当前筛选里的账号统一启用或禁用。' : '当前筛选结果为空。'}
                  tone="emerald"
                  active={enabledCount === filteredFiles.length && filteredFiles.length > 0}
                  onClick={handleToggleAllEnabled}
                  disabled={!filteredFiles.length || bulkStatusUpdating}
                  meta={filteredFiles.length ? `${enabledCount}/${filteredFiles.length} 已启用` : '暂无文件'}
                />
              </div>

            </aside>

            <div className="relative flex min-h-0 flex-col bg-white">
              <div className="border-b border-slate-100 px-4 py-4 lg:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">账号摘要卡片</div>
                    <div className="mt-1 text-xs text-slate-500">卡片底部可直接进行模型、详情、下载和删除操作。</div>
                  </div>
                  <div className="text-xs text-slate-500">分页 {currentPage}/{totalPages}</div>
                </div>
              </div>

              <div className={`flex-1 overflow-auto p-4 lg:p-5 ${showDrawerSelectionOverlay ? 'pb-28 lg:pb-32' : ''}`}>
                {filteredFiles.length === 0 ? (
                  <EmptyState type="empty" embedded />
                ) : (
                  <div className={drawerCardShellClassName}>
                    <div className={drawerCardGridClassName}>
                      {pageItems.map((file) => {
                        const stats = getFileStats(file)
                        return (
                          <FileCard
                            key={file.name}
                            file={file}
                            isDeleting={deleting === file.name}
                            statusUpdating={statusUpdating.has(file.name)}
                            selectionMode={selectionMode}
                            selected={selectedNames.has(file.name)}
                            stats={stats}
                            loadRate={stats?.loadRate}
                            totalRequests={loadStats?.totalRequests ?? 0}
                            onSelectChange={(checked) => handleSelectChange(file.name, checked)}
                            onToggleEnabled={(nextEnabled) => handleSetDisabled(file.name, !nextEnabled)}
                            onShowModels={() => showModels(file)}
                            onShowDetail={() => showDetail(file)}
                            onDownload={() => handleDownload(file)}
                            onDelete={() => handleDelete(file.name)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {showDrawerSelectionOverlay ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 lg:px-5">
                  <div className="pointer-events-auto w-full max-w-[680px] rounded-[22px] border border-slate-200 bg-white/96 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">选中模式</div>
                        <div className="mt-1 text-xs text-slate-500">已选 {selectedCount} 项</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <DrawerActionButton label={allFilteredSelected ? '取消当前全选' : '全部选中'} icon={<CheckCheck className="h-3.5 w-3.5" />} onClick={allFilteredSelected ? handleUnselectAllFiltered : handleSelectAllFiltered} disabled={!!deleting || bulkStatusUpdating} />
                        <DrawerActionButton label="开启选中" icon={<Power className="h-3.5 w-3.5" />} onClick={() => handleSetSelectedDisabled(false)} disabled={selectedCount === 0 || bulkStatusUpdating} />
                        <DrawerActionButton label="禁用选中" icon={<PowerOff className="h-3.5 w-3.5" />} onClick={() => handleSetSelectedDisabled(true)} disabled={selectedCount === 0 || bulkStatusUpdating} />
                        <DrawerActionButton label="取消选择" icon={<X className="h-3.5 w-3.5" />} onClick={clearSelection} disabled={!!deleting || bulkStatusUpdating} />
                        <DrawerActionButton label={`删除选中 (${selectedCount})`} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDeleteSelectedClick} disabled={!!deleting || selectedCount === 0 || bulkStatusUpdating} tone="danger" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {totalPages > 1 ? (
                <div className="border-t border-slate-100 px-4 py-4 lg:px-5">
                  <div className="flex justify-center">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      {oauthConfigOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOauthConfigOpen(false)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-5xl overflow-auto">
            <button
              onClick={() => setOauthConfigOpen(false)}
              className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow hover:bg-white hover:text-slate-700 cursor-pointer"
              title="关闭"
            >
              <X className="h-4 w-4" />
            </button>
            <ExcludedModelsCard existingTypes={existingTypes} />
          </div>
        </div>
      ) : null}

      <ModelsModal
        open={modelsModal.open}
        fileName={modelsModal.file?.name || ''}
        models={modelsModal.models}
        loading={modelsModal.loading}
        onClose={closeModels}
      />
      <DetailModal
        open={detailModal.open}
        file={detailModal.file}
        statusUpdating={detailModal.file ? statusUpdating.has(detailModal.file.name) : false}
        onClose={closeDetail}
        onToggleEnabled={(nextEnabled) => {
          if (!detailModal.file) return
          void handleSetDisabled(detailModal.file.name, !nextEnabled)
        }}
        onShowModels={() => {
          if (!detailModal.file) return
          void showModels(detailModal.file)
        }}
        onDownload={() => {
          if (!detailModal.file) return
          void handleDownload(detailModal.file)
        }}
        onDelete={() => {
          if (!detailModal.file) return
          void handleDelete(detailModal.file.name)
          closeDetail()
        }}
      />
    </div>
  )
}
