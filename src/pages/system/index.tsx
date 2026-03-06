/**
 * 系统配置页面（分页切换）
 * - 顶部菜单切换分区，不做页面内滚动
 * - 小屏按钮打开卡片菜单
 * - 统一错误反馈（Toast）
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  RefreshCw,
  Globe,
  Zap,
  FileText,
  Shield,
  RotateCcw,
  Info,
  Loader2,
  Package,
  Menu
} from 'lucide-react'
import { useAuthStore, useConfigStore } from '@/stores'
import { configApi } from '@/services/api'
import { useToast } from '@/components/ui'

const FRONTEND_VERSION = __APP_VERSION__

type SectionKey = 'version' | 'quota' | 'security' | 'proxy' | 'logging' | 'retry'

const parseVersion = (version: string): number => {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return 0
  const [, major, minor, patch] = match
  return Number(major) * 10000 + Number(minor) * 100 + Number(patch)
}

const clampRetry = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.min(10, Math.max(0, Math.round(value)))
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
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
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({
  icon,
  iconBg,
  title,
  description,
  loading,
  children
}: {
  icon: React.ReactNode
  iconBg?: string
  title: string
  description?: string
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg ${iconBg || 'bg-gray-100'} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {children}
      </div>
    </div>
  )
}

function SectionCard({
  icon,
  iconBg,
  title,
  description,
  children
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 min-h-[420px]">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function SystemPage() {
  const { error: toastError, success: toastSuccess } = useToast()

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

  const [activeSection, setActiveSection] = useState<SectionKey>('version')
  const [menuOpen, setMenuOpen] = useState(false)

  const sections: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
    { key: 'version', label: '版本信息', icon: <Package className="w-4 h-4" /> },
    { key: 'quota', label: '配额策略', icon: <Zap className="w-4 h-4" /> },
    { key: 'security', label: '安全设置', icon: <Shield className="w-4 h-4" /> },
    { key: 'proxy', label: '代理设置', icon: <Globe className="w-4 h-4" /> },
    { key: 'logging', label: '日志设置', icon: <FileText className="w-4 h-4" /> },
    { key: 'retry', label: '重试设置', icon: <RotateCcw className="w-4 h-4" /> }
  ]

  const activeSectionLabel = sections.find((s) => s.key === activeSection)?.label || '系统配置'

  useEffect(() => {
    if (config) {
      setProxyUrl(config['proxy-url'] || '')
      setRequestRetry(clampRetry(config['request-retry'] ?? 3))
    }
  }, [config])

  const switchSection = (key: SectionKey) => {
    setActiveSection(key)
    setMenuOpen(false)
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchConfig(true)
    } catch (error: any) {
      toastError(error?.message || '刷新配置失败')
    } finally {
      setRefreshing(false)
    }
  }, [fetchConfig, toastError])

  const checkLatestVersion = useCallback(async (silent = false) => {
    setVersionLoading(true)
    try {
      const res = await fetch('https://api.github.com/repos/ncyxx/cpa-web/releases/latest')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      const latest = data.tag_name || null
      setLatestVersion(latest)

      if (!latest) {
        setHasUpdate(false)
        return
      }

      const latestNum = parseVersion(latest)
      const currentNum = parseVersion(`v${FRONTEND_VERSION}`)
      setHasUpdate(latestNum > currentNum)
    } catch (error: any) {
      setHasUpdate(false)
      if (!silent) {
        toastError(error?.message || '检查更新失败')
      }
    } finally {
      setVersionLoading(false)
    }
  }, [toastError])

  useEffect(() => {
    checkLatestVersion(true)
  }, [checkLatestVersion])

  const handleToggle = async (key: string, value: boolean, apiCall: (v: boolean) => Promise<any>) => {
    setToggleLoading(prev => ({ ...prev, [key]: true }))
    try {
      await apiCall(value)
      await fetchConfig(true)
    } catch (error: any) {
      toastError(error?.message || '保存失败，请稍后重试')
      try {
        await fetchConfig(true)
      } catch {
        // ignore secondary error
      }
    } finally {
      setToggleLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleUpdateProxy = async () => {
    setProxyLoading(true)
    try {
      if (proxyUrl.trim()) {
        await configApi.putProxyUrl(proxyUrl.trim())
      } else {
        await configApi.deleteProxyUrl()
      }
      await fetchConfig(true)
      toastSuccess('代理配置已更新')
    } catch (error: any) {
      toastError(error?.message || '代理配置更新失败')
    } finally {
      setProxyLoading(false)
    }
  }

  const handleClearProxy = async () => {
    setProxyLoading(true)
    try {
      await configApi.deleteProxyUrl()
      setProxyUrl('')
      await fetchConfig(true)
      toastSuccess('代理配置已清空')
    } catch (error: any) {
      toastError(error?.message || '清空代理失败')
    } finally {
      setProxyLoading(false)
    }
  }

  const handleUpdateRetry = async () => {
    const nextValue = clampRetry(requestRetry)
    setRequestRetry(nextValue)

    setRetryLoading(true)
    try {
      await configApi.putRequestRetry(nextValue)
      await fetchConfig(true)
      toastSuccess('重试配置已保存')
    } catch (error: any) {
      toastError(error?.message || '保存重试配置失败')
    } finally {
      setRetryLoading(false)
    }
  }

  const renderActiveSection = () => {
    if (activeSection === 'version') {
      return (
        <SectionCard
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-violet-500"
          title="版本信息"
          description="前端面板版本与更新状态"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">v{FRONTEND_VERSION}</span>
                <p className="text-xs text-gray-500 mt-0.5">当前运行版本</p>
              </div>
            </div>

            <button
              onClick={() => checkLatestVersion(false)}
              disabled={versionLoading}
              className="px-4 py-2 rounded-xl bg-violet-50 text-violet-600 text-sm font-medium hover:bg-violet-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {versionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              检查更新
            </button>
          </div>

          {hasUpdate && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Info className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">发现新版本 {latestVersion}</p>
                  <p className="text-xs text-green-600 mt-0.5">当前版本仅支持检查更新，请按你的部署方式手动升级</p>
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      )
    }

    if (activeSection === 'quota') {
      return (
        <SectionCard
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-amber-500"
          title="配额超出策略"
          description="当配额耗尽时的自动切换行为"
        >
          <div className="space-y-1">
            <SettingRow
              icon={<Zap className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-50"
              title="自动切换项目"
              description="配额用尽时自动切换到其他项目"
              loading={toggleLoading['switch-project']}
            >
              <Toggle
                checked={config?.['quota-exceeded']?.['switch-project'] ?? false}
                onChange={(v) => handleToggle('switch-project', v, configApi.putSwitchProject)}
                disabled={disableControls || toggleLoading['switch-project']}
              />
            </SettingRow>

            <SettingRow
              icon={<Zap className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-50"
              title="切换到预览模型"
              description="配额用尽时切换到预览版模型"
              loading={toggleLoading['switch-preview']}
            >
              <Toggle
                checked={config?.['quota-exceeded']?.['switch-preview-model'] ?? false}
                onChange={(v) => handleToggle('switch-preview', v, configApi.putSwitchPreviewModel)}
                disabled={disableControls || toggleLoading['switch-preview']}
              />
            </SettingRow>
          </div>
        </SectionCard>
      )
    }

    if (activeSection === 'security') {
      return (
        <SectionCard
          icon={<Shield className="w-5 h-5" />}
          iconBg="bg-rose-500"
          title="安全设置"
          description="连接鉴权与调试相关配置"
        >
          <div className="space-y-1">
            <SettingRow
              icon={<Shield className="w-4 h-4 text-rose-600" />}
              iconBg="bg-rose-50"
              title="WebSocket 鉴权"
              description="启用 WebSocket 连接鉴权"
              loading={toggleLoading['ws-auth']}
            >
              <Toggle
                checked={config?.['ws-auth'] ?? false}
                onChange={(v) => handleToggle('ws-auth', v, configApi.putWsAuth)}
                disabled={disableControls || toggleLoading['ws-auth']}
              />
            </SettingRow>

            <SettingRow
              icon={<Info className="w-4 h-4 text-rose-600" />}
              iconBg="bg-rose-50"
              title="调试模式"
              description="启用详细的调试日志"
              loading={toggleLoading['debug']}
            >
              <Toggle
                checked={config?.debug ?? false}
                onChange={(v) => handleToggle('debug', v, configApi.putDebug)}
                disabled={disableControls || toggleLoading['debug']}
              />
            </SettingRow>
          </div>
        </SectionCard>
      )
    }

    if (activeSection === 'proxy') {
      return (
        <SectionCard
          icon={<Globe className="w-5 h-5" />}
          iconBg="bg-blue-500"
          title="代理设置"
          description="配置网络代理地址"
        >
          <label className="text-sm font-medium text-gray-700 block mb-2">代理 URL</label>
          <input
            type="text"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="例如: socks5://user:pass@127.0.0.1:1080/"
            disabled={disableControls || proxyLoading}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleClearProxy}
              disabled={disableControls || proxyLoading}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              清空
            </button>
            <button
              onClick={handleUpdateProxy}
              disabled={disableControls || proxyLoading}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {proxyLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              更新
            </button>
          </div>
        </SectionCard>
      )
    }

    if (activeSection === 'logging') {
      return (
        <SectionCard
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-green-500"
          title="日志与统计"
          description="请求日志、文件日志与统计开关"
        >
          <div className="space-y-1">
            <SettingRow
              icon={<FileText className="w-4 h-4 text-green-600" />}
              iconBg="bg-green-50"
              title="请求日志"
              description="记录 API 请求详情"
              loading={toggleLoading['request-log']}
            >
              <Toggle
                checked={config?.['request-log'] ?? false}
                onChange={(v) => handleToggle('request-log', v, configApi.putRequestLog)}
                disabled={disableControls || toggleLoading['request-log']}
              />
            </SettingRow>

            <SettingRow
              icon={<FileText className="w-4 h-4 text-green-600" />}
              iconBg="bg-green-50"
              title="写入日志文件"
              description="将日志写入文件系统"
              loading={toggleLoading['logging-to-file']}
            >
              <Toggle
                checked={config?.['logging-to-file'] ?? false}
                onChange={(v) => handleToggle('logging-to-file', v, configApi.putLoggingToFile)}
                disabled={disableControls || toggleLoading['logging-to-file']}
              />
            </SettingRow>

            <SettingRow
              icon={<Zap className="w-4 h-4 text-green-600" />}
              iconBg="bg-green-50"
              title="使用统计"
              description="启用使用量统计功能"
              loading={toggleLoading['usage-statistics']}
            >
              <Toggle
                checked={config?.['usage-statistics-enabled'] ?? false}
                onChange={(v) => handleToggle('usage-statistics', v, configApi.putUsageStatisticsEnabled)}
                disabled={disableControls || toggleLoading['usage-statistics']}
              />
            </SettingRow>
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard
        icon={<RotateCcw className="w-5 h-5" />}
        iconBg="bg-cyan-500"
        title="重试策略"
        description="请求失败时的自动重试配置"
      >
        <label className="text-sm font-medium text-gray-700 block mb-2">重试次数</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={10}
            value={requestRetry}
            onChange={(e) => setRequestRetry(clampRetry(Number(e.target.value)))}
            disabled={disableControls || retryLoading}
            className="w-24 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50"
          />
          <span className="text-sm text-gray-500">次</span>
          <button
            onClick={handleUpdateRetry}
            disabled={disableControls || retryLoading}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 ml-auto"
          >
            {retryLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            保存
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">取值范围 0-10，0 表示不重试</p>
      </SectionCard>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">系统配置</h2>
            <p className="text-xs text-gray-500 mt-0.5">当前分区：{activeSectionLabel}</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || disableControls}
          className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70">
        <div className="hidden md:flex flex-wrap gap-2">
          {sections.map((section) => {
            const active = activeSection === section.key
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => switchSection(section.key)}
                className={`h-9 px-3 rounded-xl text-sm font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            )
          })}
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="h-9 px-3 rounded-xl text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Menu className="w-4 h-4" />
            配置菜单
          </button>

          {menuOpen && (
            <div className="mt-3 p-2 rounded-xl bg-white border border-gray-200 shadow-sm grid grid-cols-2 gap-2">
              {sections.map((section) => {
                const active = activeSection === section.key
                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => switchSection(section.key)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 justify-center ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {disableControls && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-5">
            当前未连接后端，配置项已只读。请先在登录页连接到 CLIProxyAPI 后端地址。
          </div>
        )}

        <div key={activeSection} className="animate-fade-in-up">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  )
}
