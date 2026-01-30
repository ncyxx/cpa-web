/**
 * 连接状态卡片组件
 * Bento Grid Style - Apple Design
 * 
 * UX 优化：固定高度防止布局偏移
 */

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import type { Config } from '@/services/api/config'
import { configApi } from '@/services/api/config'
import { useConfigStore } from '@/stores'

interface ConnectionCardProps {
  connectionStatus: string
  apiBase: string
  serverVersion: string | null
  config: Config | null
  loading: boolean
  onRefresh: () => void
}

export function ConnectionCard({ connectionStatus, apiBase, serverVersion, config, loading, onRefresh }: ConnectionCardProps) {
  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const { updateConfigValue } = useConfigStore()
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set())

  const toggleConfig = async (
    key: 'debug' | 'usage-statistics-enabled' | 'logging-to-file' | 'request-log' | 'ws-auth',
    currentValue: boolean,
    apiMethod: (value: boolean) => Promise<any>
  ) => {
    if (!config || pendingToggles.has(key)) return

    const newValue = !currentValue
    const previousValue = currentValue

    setPendingToggles(prev => new Set(prev).add(key))
    updateConfigValue(key, newValue)

    try {
      await apiMethod(newValue)
    } catch (error: any) {
      updateConfigValue(key, previousValue)
      console.error(`Failed to update ${key}:`, error)
    } finally {
      setPendingToggles(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const updateRetry = async (value: number) => {
    if (!config || pendingToggles.has('request-retry')) return
    
    const previousValue = config['request-retry'] ?? 0
    if (value === previousValue) return

    setPendingToggles(prev => new Set(prev).add('request-retry'))
    updateConfigValue('request-retry', value)

    try {
      await configApi.putRequestRetry(value)
    } catch (error: any) {
      updateConfigValue('request-retry', previousValue)
      console.error('Failed to update request-retry:', error)
    } finally {
      setPendingToggles(prev => {
        const next = new Set(prev)
        next.delete('request-retry')
        return next
      })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* 左侧：连接状态 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isConnected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>
            {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {isConnected ? '已连接' : isConnecting ? '连接中...' : '未连接'}
              </h2>
              {serverVersion && (
                <span className="px-2 py-0.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full">
                  v{serverVersion.trim().replace(/^[vV]+/, '')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-mono">{apiBase || '未配置'}</p>
          </div>
        </div>

        {/* 中间：配置徽章 */}
        <div className="flex flex-wrap gap-2 flex-1 justify-center">
          {config ? (
            <>
              <ConfigBadge
                label="调试"
                on={config.debug}
                onClick={() => toggleConfig('debug', config.debug ?? false, configApi.putDebug)}
                disabled={!isConnected || pendingToggles.has('debug')}
              />
              <ConfigBadge
                label="统计"
                on={config['usage-statistics-enabled']}
                onClick={() => toggleConfig('usage-statistics-enabled', config['usage-statistics-enabled'] ?? false, configApi.putUsageStatisticsEnabled)}
                disabled={!isConnected || pendingToggles.has('usage-statistics-enabled')}
              />
              <ConfigBadge
                label="请求日志"
                on={config['request-log']}
                onClick={() => toggleConfig('request-log', config['request-log'] ?? false, configApi.putRequestLog)}
                disabled={!isConnected || pendingToggles.has('request-log')}
              />
              <ConfigBadge
                label="文件日志"
                on={config['logging-to-file']}
                onClick={() => toggleConfig('logging-to-file', config['logging-to-file'] ?? false, configApi.putLoggingToFile)}
                disabled={!isConnected || pendingToggles.has('logging-to-file')}
              />
              <ConfigBadge
                label="WS认证"
                on={config['ws-auth']}
                onClick={() => toggleConfig('ws-auth', config['ws-auth'] ?? false, configApi.putWsAuth)}
                disabled={!isConnected || pendingToggles.has('ws-auth')}
              />
              <RetryInput 
                value={config['request-retry'] ?? 0} 
                onChange={updateRetry}
                disabled={!isConnected || pendingToggles.has('request-retry')}
              />
              {config['commercial-mode'] && <ConfigBadge label="商业模式" special="amber" />}
              {config['health-check']?.enabled && <ConfigBadge label="健康检查" special="emerald" />}
            </>
          ) : (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-7 w-16 rounded-md bg-gray-200 animate-pulse" />
            ))
          )}
        </div>
        
        {/* 右侧：刷新按钮 */}
        <button 
          onClick={onRefresh} 
          disabled={loading}
          className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {config?.['proxy-url'] && (
        <div className="mt-3 text-xs text-gray-500">
          <span className="text-gray-400">代理: </span>
          <span className="font-mono">{config['proxy-url']}</span>
        </div>
      )}
    </div>
  )
}

function ConfigBadge({ label, on, special, onClick, disabled }: {
  label: string
  on?: boolean
  special?: 'amber' | 'emerald' | 'violet'
  onClick?: () => void
  disabled?: boolean
}) {
  const isClickable = onClick && !special
  const baseClasses = "h-7 px-3 text-xs font-medium rounded-md transition-all select-none whitespace-nowrap inline-flex items-center justify-center"
  const interactiveClasses = isClickable ? "cursor-pointer hover:opacity-80 active:scale-95" : ""
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : ""

  const handleClick = () => {
    if (isClickable && !disabled) onClick()
  }

  if (special) {
    const colors = {
      amber: 'bg-amber-50 text-amber-700',
      emerald: 'bg-emerald-50 text-emerald-700',
      violet: 'bg-violet-50 text-violet-700'
    }
    return <span className={`${baseClasses} ${colors[special]}`}>{label}</span>
  }

  return (
    <span
      className={`${baseClasses} ${interactiveClasses} ${disabledClasses} ${
        on ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-500'
      }`}
      onClick={handleClick}
    >
      {label}: {on ? '开' : '关'}
    </span>
  )
}

function RetryInput({ value, onChange, disabled }: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const [localValue, setLocalValue] = useState(String(value))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalValue(String(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '')
    setLocalValue(newValue)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      const num = parseInt(newValue, 10)
      if (!isNaN(num) && num >= 0 && num <= 10) {
        onChange(num)
      }
    }, 500)
  }

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const num = parseInt(localValue, 10)
    if (!isNaN(num) && num >= 0 && num <= 10 && num !== value) {
      onChange(num)
    } else {
      setLocalValue(String(value))
    }
  }

  return (
    <span className={`h-7 px-3 text-xs font-medium rounded-md bg-gray-100 text-gray-700 inline-flex items-center justify-center gap-1 ${disabled ? 'opacity-50' : ''}`}>
      重试:
      <input
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className="w-5 text-xs text-center bg-transparent outline-none font-medium"
        maxLength={2}
      />
    </span>
  )
}
