/**
 * Kiro Provider 组件
 * AWS CodeWhisperer Token 管理 - 手动导入和批量导入
 * Bento Grid + Apple Design Style
 */

import { useState, useRef, type ChangeEvent } from 'react'
import { Upload, FileJson, Loader2, CheckCircle, XCircle, AlertTriangle, Key, Zap, List } from 'lucide-react'
import { apiClient } from '@/services/api'
import { KiroAccountList } from './KiroAccountList'

interface KiroProviderProps {
  onSuccess?: () => void
}

interface ImportState {
  accessToken: string
  refreshToken: string
  profileArn: string
  email: string
  clientId: string
  clientSecret: string
  loading: boolean
  error?: string
  success?: boolean
}

interface BatchImportState {
  file?: File
  fileName: string
  loading: boolean
  importing: boolean
  error?: string
  progress: {
    total: number
    completed: number
    success: number
    failed: number
    banned: number
  }
}

interface KiroBatchTokenItem {
  email: string
  username?: string
  provider?: string
  clientId?: string
  clientSecret?: string
  refreshToken: string
  accessToken: string
  expiresIn?: number
  createdAt?: string
  password?: string
  authMethod?: string
}

export function KiroProvider({ onSuccess }: KiroProviderProps) {
  const [tab, setTab] = useState<'list' | 'manual' | 'batch'>('list')
  const [importState, setImportState] = useState<ImportState>({
    accessToken: '', refreshToken: '', profileArn: '', email: '',
    clientId: '', clientSecret: '', loading: false
  })
  const [batchState, setBatchState] = useState<BatchImportState>({
    fileName: '', loading: false, importing: false,
    progress: { total: 0, completed: 0, success: 0, failed: 0, banned: 0 }
  })
  const fileInputRef = useRef<HTMLInputElement>(null)


  // 手动导入
  const handleManualImport = async () => {
    const accessToken = importState.accessToken.trim()
    const refreshToken = importState.refreshToken.trim()

    if (!accessToken) {
      setImportState(prev => ({ ...prev, error: 'Access Token 不能为空' }))
      return
    }
    if (!refreshToken) {
      setImportState(prev => ({ ...prev, error: 'Refresh Token 不能为空' }))
      return
    }

    setImportState(prev => ({ ...prev, loading: true, error: undefined, success: false }))

    try {
      const res = await apiClient.post<{ status: string; error?: string }>('/kiro/import', {
        access_token: accessToken,
        refresh_token: refreshToken,
        profile_arn: importState.profileArn.trim() || '',
        email: importState.email.trim() || '',
        client_id: importState.clientId.trim() || '',
        client_secret: importState.clientSecret.trim() || ''
      })

      if (res.status === 'ok') {
        setImportState({
          accessToken: '', refreshToken: '', profileArn: '', email: '',
          clientId: '', clientSecret: '', loading: false, success: true
        })
        onSuccess?.()
        setTimeout(() => setImportState(prev => ({ ...prev, success: false })), 3000)
      } else {
        setImportState(prev => ({ ...prev, loading: false, error: res.error || '导入失败' }))
      }
    } catch (err: any) {
      setImportState(prev => ({ ...prev, loading: false, error: err?.message || '导入失败' }))
    }
  }

  // 选择文件
  const handleFilePick = () => fileInputRef.current?.click()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.json')) {
      setBatchState(prev => ({ ...prev, error: '请选择 JSON 文件' }))
      e.target.value = ''
      return
    }
    setBatchState(prev => ({ ...prev, file, fileName: file.name, error: undefined }))
    e.target.value = ''
  }

  // 批量导入
  const handleBatchImport = async () => {
    if (!batchState.file) {
      setBatchState(prev => ({ ...prev, error: '请先选择文件' }))
      return
    }

    setBatchState(prev => ({ ...prev, loading: true, error: undefined }))

    try {
      const fileContent = await batchState.file.text()
      let tokens: KiroBatchTokenItem[]

      try {
        const parsed = JSON.parse(fileContent)
        tokens = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        setBatchState(prev => ({ ...prev, loading: false, error: 'JSON 格式无效' }))
        return
      }

      if (tokens.length === 0) {
        setBatchState(prev => ({ ...prev, loading: false, error: '文件为空' }))
        return
      }

      setBatchState(prev => ({
        ...prev, loading: false, importing: true,
        progress: { total: tokens.length, completed: 0, success: 0, failed: 0, banned: 0 }
      }))

      const batchSize = 10
      let totalSuccess = 0, totalFailed = 0, totalBanned = 0, completed = 0

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize).map(token => ({ ...token, authMethod: 'batch-import' }))

        try {
          const result = await apiClient.post<{
            status: string; success_count?: number; fail_count?: number; banned_count?: number
            results?: Array<{ status: string }>
          }>('/kiro/batch-import', batch)

          if (result.status === 'ok') {
            totalSuccess += result.success_count || 0
            totalFailed += result.fail_count || 0
            totalBanned += result.banned_count || 0
          } else if (result.results?.length) {
            result.results.forEach(r => {
              if (r.status === 'ok') totalSuccess++
              else if (r.status === 'banned') totalBanned++
              else totalFailed++
            })
          } else {
            totalFailed += batch.length
          }
        } catch {
          totalFailed += batch.length
        }

        completed += batch.length
        setBatchState(prev => ({
          ...prev,
          progress: { total: tokens.length, completed, success: totalSuccess, failed: totalFailed, banned: totalBanned }
        }))
      }

      setBatchState(prev => ({ ...prev, importing: false }))
      if (totalSuccess > 0) onSuccess?.()
    } catch (err: any) {
      setBatchState(prev => ({ ...prev, loading: false, importing: false, error: err?.message }))
    }
  }


  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-5 flex-1 min-h-0">
        {/* 头部说明卡片 */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">Kiro Token 导入</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                导入 AWS CodeWhisperer 认证 Token。OAuth 授权请前往「OAuth」页面。
              </p>
            </div>
          </div>
        </div>

        {/* Tab 切换 - Bento Style */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              onClick={() => setTab('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-all cursor-pointer ${
                tab === 'list'
                  ? 'text-violet-600 bg-violet-50/50 border-b-2 border-violet-500 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              账号列表
            </button>
            <button
              onClick={() => setTab('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-all cursor-pointer ${
                tab === 'manual'
                  ? 'text-violet-600 bg-violet-50/50 border-b-2 border-violet-500 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Key className="w-4 h-4" />
              手动导入
            </button>
            <button
              onClick={() => setTab('batch')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-all cursor-pointer ${
                tab === 'batch'
                  ? 'text-violet-600 bg-violet-50/50 border-b-2 border-violet-500 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileJson className="w-4 h-4" />
              批量导入
            </button>
          </div>

          <div className="p-5 flex-1 overflow-auto">
            {/* 账号列表 */}
            {tab === 'list' && (
              <KiroAccountList onRefresh={onSuccess} />
            )}

            {/* 手动导入表单 */}
            {tab === 'manual' && (
              <div className="space-y-4">
                {/* 必填字段 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      Access Token
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={importState.accessToken}
                      onChange={e => setImportState(prev => ({ ...prev, accessToken: e.target.value, error: undefined }))}
                      placeholder="输入 Access Token"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      Refresh Token
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={importState.refreshToken}
                      onChange={e => setImportState(prev => ({ ...prev, refreshToken: e.target.value, error: undefined }))}
                      placeholder="输入 Refresh Token"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 可选字段 */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">可选配置</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField label="Profile ARN" value={importState.profileArn} onChange={v => setImportState(prev => ({ ...prev, profileArn: v }))} placeholder="可选" />
                    <InputField label="Email" value={importState.email} onChange={v => setImportState(prev => ({ ...prev, email: v }))} placeholder="可选" type="email" />
                    <InputField label="Client ID" value={importState.clientId} onChange={v => setImportState(prev => ({ ...prev, clientId: v }))} placeholder="可选" />
                    <InputField label="Client Secret" value={importState.clientSecret} onChange={v => setImportState(prev => ({ ...prev, clientSecret: v }))} placeholder="可选" />
                  </div>
                </div>

                {/* 状态提示 */}
                {importState.error && <StatusMessage type="error" message={importState.error} />}
                {importState.success && <StatusMessage type="success" message="Token 导入成功！" />}

                {/* 提交按钮 */}
                <button
                  onClick={handleManualImport}
                  disabled={importState.loading || !importState.accessToken || !importState.refreshToken}
                  className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                >
                  {importState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  导入 Token
                </button>
              </div>
            )}


            {/* 批量导入 */}
            {tab === 'batch' && (
              <div className="space-y-4">
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

                {/* 文件上传区域 */}
                <div
                  onClick={handleFilePick}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    batchState.fileName
                      ? 'border-violet-300 bg-violet-50/50'
                      : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/30'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      batchState.fileName ? 'bg-violet-100' : 'bg-gray-100'
                    }`}>
                      <FileJson className={`w-6 h-6 ${batchState.fileName ? 'text-violet-600' : 'text-gray-400'}`} />
                    </div>
                    {batchState.fileName ? (
                      <>
                        <p className="text-sm font-medium text-violet-600">{batchState.fileName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">点击更换文件</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">点击选择 JSON 文件</p>
                        <p className="text-xs text-gray-400 mt-0.5">支持单个或多个 Token 的 JSON 数组</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 导入进度 */}
                {batchState.importing && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">导入进度</span>
                      <span className="text-sm font-semibold text-violet-600">
                        {batchState.progress.completed}/{batchState.progress.total}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${(batchState.progress.completed / batchState.progress.total) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <StatBadge icon={<CheckCircle className="w-3.5 h-3.5" />} label="成功" value={batchState.progress.success} color="green" />
                      <StatBadge icon={<XCircle className="w-3.5 h-3.5" />} label="失败" value={batchState.progress.failed} color="red" />
                      {batchState.progress.banned > 0 && (
                        <StatBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="封禁" value={batchState.progress.banned} color="amber" />
                      )}
                    </div>
                  </div>
                )}

                {/* 状态提示 */}
                {batchState.error && <StatusMessage type="error" message={batchState.error} />}

                {/* 提交按钮 */}
                <button
                  onClick={handleBatchImport}
                  disabled={!batchState.file || batchState.loading || batchState.importing}
                  className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer shadow-sm hover:shadow-md"
                >
                  {(batchState.loading || batchState.importing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  开始导入
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 输入框组件
function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white transition-all"
      />
    </div>
  )
}

// 状态消息组件
function StatusMessage({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error'
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
      isError ? 'text-red-700 bg-red-50 border border-red-100' : 'text-green-700 bg-green-50 border border-green-100'
    }`}>
      {isError ? <XCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  )
}

// 统计徽章组件
function StatBadge({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: 'green' | 'red' | 'amber'
}) {
  const colors = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    amber: 'text-amber-600 bg-amber-50'
  }
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${colors[color]}`}>
      {icon}
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
