/**
 * API 密钥管理页面
 * Bento Grid Style - Apple Design System
 */

import { Key, Plus, RefreshCw, Download, Sparkles, Shield, Eye } from 'lucide-react'
import {
  StatCard,
  ActionButton,
  KeyListItem,
  AddEditModal,
  BatchModal
} from './components'
import {
  useApiKeysData,
  useApiKeysSelection,
  useApiKeysActions,
  useApiKeysModals
} from './hooks'

export function ApiKeysPage() {
  // 数据
  const { apiKeys, setApiKeys, error, setError, loadApiKeys, connectionStatus } = useApiKeysData()
  const disableControls = connectionStatus !== 'connected'

  // 选择和显示
  const {
    selectedKeys, setSelectedKeys,
    visibleKeys,
    toggleVisibility,
    handleToggleSelect,
    handleSelectAll,
    isAllSelected
  } = useApiKeysSelection(apiKeys)

  // 操作
  const {
    saving,
    copiedIndex,
    handleCopy,
    handleExport,
    handleSave,
    handleBatchGenerate,
    handleDelete,
    generateRandomApiKey
  } = useApiKeysActions(apiKeys, setApiKeys, setError, selectedKeys, setSelectedKeys)

  // 弹窗
  const {
    modalType,
    editingIndex,
    inputValue, setInputValue,
    batchCount, setBatchCount,
    openAddModal,
    openEditModal,
    openBatchModal,
    closeModal
  } = useApiKeysModals()

  // 保存处理
  const onSave = async () => {
    const success = await handleSave(inputValue, editingIndex)
    if (success) closeModal()
  }

  // 批量生成处理
  const onBatchGenerate = async () => {
    const count = parseInt(batchCount, 10)
    const success = await handleBatchGenerate(count)
    if (success) closeModal()
  }

  return (
    <div className="space-y-4">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<Key className="w-4 h-4" />}
          label="密钥总数"
          value={apiKeys.length}
          bg="bg-blue-500"
          color="text-blue-600"
          gradientBg="bg-gradient-to-br from-blue-50 to-blue-100/50"
        />
        <StatCard
          icon={<Shield className="w-4 h-4" />}
          label="已选择"
          value={selectedKeys.size}
          bg="bg-purple-500"
          color="text-purple-600"
          gradientBg="bg-gradient-to-br from-purple-50 to-purple-100/50"
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label="已显示"
          value={visibleKeys.size}
          bg="bg-green-500"
          color="text-green-600"
          gradientBg="bg-gradient-to-br from-green-50 to-green-100/50"
        />
        <StatCard
          icon={<Sparkles className="w-4 h-4" />}
          label="连接状态"
          value={connectionStatus === 'connected' ? '已连接' : '未连接'}
          bg={connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}
          color={connectionStatus === 'connected' ? 'text-emerald-600' : 'text-red-600'}
          gradientBg={connectionStatus === 'connected' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50' : 'bg-gradient-to-br from-red-50 to-red-100/50'}
        />
      </div>

      {/* 主内容卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">代理服务认证密钥</h3>
              <p className="text-xs text-gray-500 mt-0.5">管理 API 访问凭证</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton icon={<RefreshCw className="w-4 h-4" />} label="刷新" onClick={loadApiKeys} disabled={disableControls} />
            <ActionButton icon={<Download className="w-4 h-4" />} label={selectedKeys.size > 0 ? `导出 (${selectedKeys.size})` : '导出'} onClick={handleExport} disabled={apiKeys.length === 0} />
            <ActionButton icon={<Sparkles className="w-4 h-4" />} label="批量生成" onClick={openBatchModal} disabled={disableControls} />
            <ActionButton icon={<Plus className="w-4 h-4" />} label="添加密钥" onClick={openAddModal} disabled={disableControls} variant="primary" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">{error}</div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium">暂无密钥</p>
              <p className="text-sm mt-1">点击"添加密钥"或"批量生成"创建</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              {apiKeys.length > 1 && (
                <div className="px-5 py-2 border-b border-gray-50 bg-gray-50/30">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                    全选 ({apiKeys.length})
                  </label>
                </div>
              )}

              {/* Key List */}
              <div className="divide-y divide-gray-50">
                {apiKeys.map((key, index) => (
                  <KeyListItem
                    key={index}
                    apiKey={key}
                    index={index}
                    isSelected={selectedKeys.has(index)}
                    isVisible={visibleKeys.has(index)}
                    isCopied={copiedIndex === index}
                    disabled={disableControls}
                    onToggleSelect={() => handleToggleSelect(index)}
                    onToggleVisibility={() => toggleVisibility(index)}
                    onCopy={() => handleCopy(key, index)}
                    onEdit={() => openEditModal(index, key)}
                    onDelete={() => handleDelete(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between text-xs text-gray-500">
          <span>共 {apiKeys.length} 个密钥</span>
          {selectedKeys.size > 0 && <span>已选择 {selectedKeys.size} 个</span>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modalType === 'add' || modalType === 'edit') && (
        <AddEditModal
          isEdit={modalType === 'edit'}
          inputValue={inputValue}
          saving={saving}
          onInputChange={setInputValue}
          onGenerate={() => setInputValue(generateRandomApiKey())}
          onSave={onSave}
          onClose={closeModal}
        />
      )}

      {/* Batch Modal */}
      {modalType === 'batch' && (
        <BatchModal
          batchCount={batchCount}
          saving={saving}
          onCountChange={setBatchCount}
          onGenerate={onBatchGenerate}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
