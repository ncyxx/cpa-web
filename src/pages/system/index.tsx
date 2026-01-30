/**
 * 系统配置页面 - 单卡片容器布局
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, RefreshCw, Globe, Zap, FileText, Shield, RotateCcw, Info, Loader2, Package
} from 'lucide-react'
import { useAuthStore, useConfigStore } from '@/stores'
import { configApi } from '@/services/api'

// 前端版本号
const FRONTEND_VERSION = __APP_VERSION__

function Toggle({ checked, onChange, disabled }: { 
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean 
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

function SettingItem({ icon, iconBg, title, description, children, loading }: {
  icon: React.ReactNode; iconBg?: string; title: string; description?: string
  children: React.ReactNode; loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ icon, iconBg, title, description }: { 
  icon: React.ReactNode; iconBg: string; title: string; description?: string 
}) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}


export function SystemPage() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const config = useConfigStore((state) => state.config)
  const fetchConfig = useConfigStore((state) => state.fetchConfig)
  const disableControls = connectionStatus !== 'connected'

  const [refreshing, setRefreshing] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [versionLoading, setVersionLoading] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [proxyUrl, setProxyUrl] = useState('')
  const [proxyLoading, setProxyLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
  const [requestRetry, setRequestRetry] = useState(3)
  const [retryLoading, setRetryLoading] = useState(false)

  useEffect(() => {
    if (config) {
      setProxyUrl(config['proxy-url'] || '')
      setRequestRetry(config['request-retry'] ?? 3)
    }
  }, [config])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await fetchConfig(true) } finally { setRefreshing(false) }
  }, [fetchConfig])

  const checkLatestVersion = useCallback(async () => {
    setVersionLoading(true)
    try {
      // 从 GitHub API 获取最新前端版本
      const res = await fetch('https://api.github.com/repos/ncyxx/cpa-web/releases/latest')
      if (res.ok) {
        const data = await res.json()
        const latest = data.tag_name || null
        setLatestVersion(latest)
        // 比较版本
        if (latest && latest !== `v${FRONTEND_VERSION}`) {
          setHasUpdate(true)
        } else {
          setHasUpdate(false)
        }
      }
    } catch (err) { console.error(err) }
    finally { setVersionLoading(false) }
  }, [])

  useEffect(() => {
    checkLatestVersion()
  }, [])

  const handleUpdateProxy = async () => {
    setProxyLoading(true)
    try {
      if (proxyUrl.trim()) await configApi.putProxyUrl(proxyUrl.trim())
      else await configApi.deleteProxyUrl()
      await fetchConfig(true)
    } finally { setProxyLoading(false) }
  }

  const handleClearProxy = async () => {
    setProxyLoading(true)
    try {
      await configApi.deleteProxyUrl()
      setProxyUrl('')
      await fetchConfig(true)
    } finally { setProxyLoading(false) }
  }

  const handleToggle = async (key: string, value: boolean, apiCall: (v: boolean) => Promise<any>) => {
    setToggleLoading(prev => ({ ...prev, [key]: true }))
    try { await apiCall(value); await fetchConfig(true) }
    finally { setToggleLoading(prev => ({ ...prev, [key]: false })) }
  }

  const handleUpdateRetry = async () => {
    setRetryLoading(true)
    try { await configApi.putRequestRetry(requestRetry); await fetchConfig(true) }
    finally { setRetryLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">系统配置</h2>
            <p className="text-xs text-gray-500 mt-0.5">管理系统级别的配置选项</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing || disableControls}
          className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* 左列 */}
        <div className="p-6 space-y-6 lg:border-r border-gray-100">
          {/* 版本信息 */}
          <div>
            <SectionTitle icon={<Package className="w-5 h-5" />} iconBg="bg-violet-500" title="版本信息" description="前端面板版本" />
            <div className="mt-3 space-y-1">
              <SettingItem icon={<Package className="w-4 h-4 text-violet-600" />} iconBg="bg-violet-50" title="当前版本" description="当前运行的前端版本">
                <span className="text-sm font-medium text-gray-900">v{FRONTEND_VERSION}</span>
              </SettingItem>
              <SettingItem icon={<Info className="w-4 h-4 text-violet-600" />} iconBg="bg-violet-50" title="最新版本" description="GitHub 上的最新版本" loading={versionLoading}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${hasUpdate ? 'text-green-600' : 'text-gray-900'}`}>
                    {latestVersion || '未知'}
                  </span>
                  {hasUpdate && <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">有更新</span>}
                  <button onClick={checkLatestVersion} disabled={versionLoading}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                    检查更新
                  </button>
                </div>
              </SettingItem>
            </div>
          </div>

          {/* 配额超出行为 */}
          <div>
            <SectionTitle icon={<Zap className="w-5 h-5" />} iconBg="bg-amber-500" title="配额超出行为" description="当配额用尽时的处理策略" />
            <div className="mt-3 space-y-1">
              <SettingItem icon={<Zap className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" title="自动切换项目" description="配额用尽时自动切换到其他项目" loading={toggleLoading['switch-project']}>
                <Toggle checked={config?.['quota-exceeded']?.['switch-project'] ?? false} onChange={(v) => handleToggle('switch-project', v, configApi.putSwitchProject)} disabled={disableControls || toggleLoading['switch-project']} />
              </SettingItem>
              <SettingItem icon={<Zap className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" title="切换到预览模型" description="配额用尽时切换到预览版模型" loading={toggleLoading['switch-preview']}>
                <Toggle checked={config?.['quota-exceeded']?.['switch-preview-model'] ?? false} onChange={(v) => handleToggle('switch-preview', v, configApi.putSwitchPreviewModel)} disabled={disableControls || toggleLoading['switch-preview']} />
              </SettingItem>
            </div>
          </div>

          {/* 安全设置 */}
          <div>
            <SectionTitle icon={<Shield className="w-5 h-5" />} iconBg="bg-rose-500" title="安全设置" description="WebSocket 和调试选项" />
            <div className="mt-3 space-y-1">
              <SettingItem icon={<Shield className="w-4 h-4 text-rose-600" />} iconBg="bg-rose-50" title="WebSocket 鉴权" description="启用 WebSocket 连接鉴权" loading={toggleLoading['ws-auth']}>
                <Toggle checked={config?.['ws-auth'] ?? false} onChange={(v) => handleToggle('ws-auth', v, configApi.putWsAuth)} disabled={disableControls || toggleLoading['ws-auth']} />
              </SettingItem>
              <SettingItem icon={<Info className="w-4 h-4 text-rose-600" />} iconBg="bg-rose-50" title="调试模式" description="启用详细的调试日志" loading={toggleLoading['debug']}>
                <Toggle checked={config?.debug ?? false} onChange={(v) => handleToggle('debug', v, configApi.putDebug)} disabled={disableControls || toggleLoading['debug']} />
              </SettingItem>
            </div>
          </div>
        </div>

        {/* 右列 */}
        <div className="p-6 space-y-6">
          {/* 代理设置 */}
          <div>
            <SectionTitle icon={<Globe className="w-5 h-5" />} iconBg="bg-blue-500" title="代理设置" description="配置网络代理" />
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">代理 URL</label>
              <input type="text" value={proxyUrl} onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="例如: socks5://user:pass@127.0.0.1:1080/" disabled={disableControls || proxyLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50" />
              <div className="flex gap-2 mt-3">
                <button onClick={handleClearProxy} disabled={disableControls || proxyLoading}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50">清空</button>
                <button onClick={handleUpdateProxy} disabled={disableControls || proxyLoading}
                  className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {proxyLoading && <Loader2 className="w-4 h-4 animate-spin" />}更新
                </button>
              </div>
            </div>
          </div>

          {/* 日志设置 */}
          <div>
            <SectionTitle icon={<FileText className="w-5 h-5" />} iconBg="bg-green-500" title="日志设置" description="配置日志记录选项" />
            <div className="mt-3 space-y-1">
              <SettingItem icon={<FileText className="w-4 h-4 text-green-600" />} iconBg="bg-green-50" title="请求日志" description="记录 API 请求详情" loading={toggleLoading['request-log']}>
                <Toggle checked={config?.['request-log'] ?? false} onChange={(v) => handleToggle('request-log', v, configApi.putRequestLog)} disabled={disableControls || toggleLoading['request-log']} />
              </SettingItem>
              <SettingItem icon={<FileText className="w-4 h-4 text-green-600" />} iconBg="bg-green-50" title="写入日志文件" description="将日志写入文件系统" loading={toggleLoading['logging-to-file']}>
                <Toggle checked={config?.['logging-to-file'] ?? false} onChange={(v) => handleToggle('logging-to-file', v, configApi.putLoggingToFile)} disabled={disableControls || toggleLoading['logging-to-file']} />
              </SettingItem>
              <SettingItem icon={<Zap className="w-4 h-4 text-green-600" />} iconBg="bg-green-50" title="使用统计" description="启用使用量统计功能" loading={toggleLoading['usage-statistics']}>
                <Toggle checked={config?.['usage-statistics-enabled'] ?? false} onChange={(v) => handleToggle('usage-statistics', v, configApi.putUsageStatisticsEnabled)} disabled={disableControls || toggleLoading['usage-statistics']} />
              </SettingItem>
            </div>
          </div>

          {/* 重试设置 */}
          <div>
            <SectionTitle icon={<RotateCcw className="w-5 h-5" />} iconBg="bg-cyan-500" title="重试设置" description="请求失败时的重试策略" />
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">重试次数</label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={10} value={requestRetry} onChange={(e) => setRequestRetry(parseInt(e.target.value) || 0)}
                  disabled={disableControls || retryLoading}
                  className="w-24 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50" />
                <span className="text-sm text-gray-500">次</span>
                <button onClick={handleUpdateRetry} disabled={disableControls || retryLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ml-auto">
                  {retryLoading && <Loader2 className="w-4 h-4 animate-spin" />}保存
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">请求失败时自动重试的次数，0 表示不重试</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
