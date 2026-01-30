import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { Eye, EyeOff } from 'lucide-react'
import './LoginPage.scss'

const detectApiBaseFromLocation = (): string => {
  try {
    const { protocol, hostname, port } = window.location
    const normalizedPort = port ? `:${port}` : ''
    return `${protocol}//${hostname}${normalizedPort}`
  } catch {
    return 'http://localhost:3000'
  }
}

const normalizeApiBase = (input: string): string => {
  let base = (input || '').trim()
  if (!base) return ''
  base = base.replace(/\/?v0\/management\/?$/i, '')
  base = base.replace(/\/+$/i, '')
  if (!/^https?:\/\//i.test(base)) {
    base = `http://${base}`
  }
  return base
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAuthenticated,
    login,
    restoreSession,
    apiBase: storedBase,
    managementKey: storedKey,
    useCustomBase: storedUseCustomBase,
    setUseCustomBase
  } = useAuthStore()

  const [apiBase, setApiBase] = useState('')
  const [managementKey, setManagementKey] = useState('')
  const [showCustomBase, setShowCustomBase] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(true)
  const [error, setError] = useState('')

  const detectedBase = useMemo(() => detectApiBaseFromLocation(), [])

  useEffect(() => {
    console.log('[LoginPage] Mount effect running')
    console.log('[LoginPage] Stored values:', { storedBase, storedKey: storedKey ? '***' : '', storedUseCustomBase })

    const init = async () => {
      try {
        const autoLoggedIn = await restoreSession()
        console.log('[LoginPage] restoreSession result:', autoLoggedIn)

        if (!autoLoggedIn) {
          // 恢复保存的状态 - 优先使用 store 中保存的值
          const savedUseCustom = storedUseCustomBase === true
          const savedBase = storedBase || detectedBase
          const savedKey = storedKey || ''

          console.log('[LoginPage] Restoring state:', { savedBase, savedKey: savedKey ? '***' : '', savedUseCustom })

          // 先设置 showCustomBase，再设置 apiBase
          setShowCustomBase(savedUseCustom)
          setApiBase(savedBase)
          setManagementKey(savedKey)
        }
      } finally {
        setAutoLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 登录成功后的跳转（包括手动登录和自动登录）
  useEffect(() => {
    console.log('[LoginPage] Navigation effect triggered, isAuthenticated:', isAuthenticated)
    if (isAuthenticated) {
      const redirect = (location.state as any)?.from?.pathname || '/admin'
      console.log('[LoginPage] Navigating to:', redirect)
      navigate(redirect, { replace: true })
      console.log('[LoginPage] navigate() called')
    }
  }, [isAuthenticated, navigate, location.state])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    console.log('[LoginPage] handleSubmit called')

    if (!managementKey.trim()) {
      setError('请输入管理密钥')
      return
    }

    const baseToUse = showCustomBase && apiBase ? normalizeApiBase(apiBase) : detectedBase
    console.log('[LoginPage] Connecting to:', baseToUse)

    setLoading(true)
    setError('')

    try {
      await login({ apiBase: baseToUse, managementKey: managementKey.trim() })
      console.log('[LoginPage] login() completed successfully')
      // 登录成功，状态更新后 useEffect 会自动处理跳转
    } catch (err: any) {
      console.error('[LoginPage] login() failed:', err)
      const message = err?.message || '连接失败，请检查地址和密钥'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__background" />

      <div className="login-page__container">
        <div className="login-form">
          <div className="login-form__header">
            <h1 className="login-form__title">CLI Proxy 管理</h1>
            <p className="login-form__subtitle">连接到您的 CLI Proxy 服务</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form__content">
            <div className="login-form__field">
              <label htmlFor="apiBase" className="login-form__label">
                当前连接地址
              </label>
              <input
                id="apiBase"
                value={apiBase || detectedBase}
                onChange={(e) => setApiBase(e.target.value)}
                type="text"
                placeholder="http://localhost:3000"
                disabled={!showCustomBase}
                className="login-form__input login-form__input--mono"
              />
              <p className="login-form__helper">自动检测自当前页面地址</p>
            </div>

            <div className="login-form__checkbox">
              <input
                id="custom-connection-toggle"
                type="checkbox"
                checked={showCustomBase}
                onChange={(e) => {
                  const checked = e.target.checked
                  console.log('[LoginPage] Checkbox changed to:', checked)
                  setShowCustomBase(checked)
                  setUseCustomBase(checked)
                  console.log('[LoginPage] setUseCustomBase called with:', checked)
                }}
                className="login-form__checkbox-input"
              />
              <label htmlFor="custom-connection-toggle" className="login-form__checkbox-label">
                使用自定义连接地址
              </label>
            </div>

            <div className="login-form__field">
              <label htmlFor="managementKey" className="login-form__label">
                管理密钥
              </label>
              <div className="login-form__input-wrapper">
                <input
                  id="managementKey"
                  value={managementKey}
                  onChange={(e) => setManagementKey(e.target.value)}
                  type={showKey ? 'text' : 'password'}
                  placeholder="请输入管理密钥"
                  required
                  className="login-form__input login-form__input--with-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="login-form__input-icon"
                  aria-label={showKey ? '隐藏密钥' : '显示密钥'}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-form__error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-form__submit"
              disabled={loading}
            >
              {loading && <span className="login-form__loading-spinner" />}
              {loading ? '连接中...' : '连接'}
            </button>

            {autoLoading && (
              <div className="login-form__auto-login">
                <div className="login-form__auto-login-label">自动登录</div>
                <div className="login-form__auto-login-text">正在尝试恢复上次会话...</div>
              </div>
            )}
          </form>
        </div>

        <div className="login-page__footer">
          <p>© 2026 CLI Proxy UI</p>
        </div>
      </div>
    </div>
  )
}
