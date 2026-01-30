/**
 * OAuth 登录模态框
 * 支持 Project ID (Gemini) 和认证方式选择 (Kiro)
 */

import { useEffect } from 'react'
import { X, ExternalLink, Copy, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { type ProviderConfig, KIRO_AUTH_METHODS, type KiroAuthMethod } from '../../constants'
import type { ProviderState } from '../../hooks'

interface OAuthModalProps {
  isOpen: boolean
  onClose: () => void
  provider: ProviderConfig | null
  state: ProviderState
  onProjectIdChange: (value: string) => void
  onAuthMethodChange: (method: KiroAuthMethod) => void
  onCallbackUrlChange: (value: string) => void
  onSubmitCallback: () => void
  onStartAuth: (method?: KiroAuthMethod) => void
}

export function OAuthModal({
  isOpen,
  onClose,
  provider,
  state,
  onProjectIdChange,
  onAuthMethodChange,
  onCallbackUrlChange,
  onSubmitCallback,
  onStartAuth
}: OAuthModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !provider) return null

  const copyLink = () => {
    if (state.url) navigator.clipboard.writeText(state.url)
  }

  const openLink = () => {
    if (state.url) window.open(state.url, '_blank', 'noopener,noreferrer')
  }

  // 是否需要先输入/选择
  const needsProjectId = provider.requiresProjectId && !state.url
  const needsAuthMethod = provider.requiresAuthMethod && !state.url
  const showStartButton = (needsProjectId || needsAuthMethod || (!state.url && !state.polling)) && !state.url

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${provider.bgColor} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${provider.color}`}>
                  {provider.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                <p className="text-sm text-gray-500">OAuth 登录认证</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status */}
          {(state.status !== 'idle' || state.polling) && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              state.status === 'success' ? 'bg-green-50 text-green-700' :
              state.status === 'error' ? 'bg-red-50 text-red-700' :
              'bg-amber-50 text-amber-700'
            }`}>
              {state.status === 'success' && <CheckCircle className="w-5 h-5" />}
              {state.status === 'error' && <XCircle className="w-5 h-5" />}
              {(state.status === 'waiting' || state.polling) && state.status !== 'success' && state.status !== 'error' && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>
                {state.status === 'success' ? '认证成功！凭证已保存' :
                 state.status === 'error' ? (state.error || '认证失败') :
                 state.polling ? '正在等待认证完成...' : '准备中'}
              </span>
            </div>
          )}

          {/* Project ID (Gemini) */}
          {provider.requiresProjectId && !state.url && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Project ID</label>
              <input
                type="text"
                value={state.projectId || ''}
                onChange={e => onProjectIdChange(e.target.value)}
                placeholder="Google Cloud Project ID"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-400">在 Google Cloud Console 中获取</p>
            </div>
          )}

          {/* Auth Method (Kiro) */}
          {provider.requiresAuthMethod && !state.url && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">选择认证方式</label>
              <div className="grid grid-cols-3 gap-3">
                {KIRO_AUTH_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => onAuthMethodChange(method.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      state.authMethod === method.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
              {state.error && state.status === 'idle' && (
                <p className="text-xs text-red-500">{state.error}</p>
              )}
            </div>
          )}

          {/* Start Button */}
          {showStartButton && (
            <button
              onClick={() => onStartAuth(state.authMethod)}
              disabled={state.polling || (provider.requiresProjectId && !state.projectId?.trim()) || (provider.requiresAuthMethod && !state.authMethod)}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {state.polling && <Loader2 className="w-4 h-4 animate-spin" />}
              开始登录
            </button>
          )}

          {/* Auth URL */}
          {state.url && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">登录链接</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-600 break-all font-mono mb-4 leading-relaxed">{state.url}</p>
                <div className="flex gap-3">
                  <button
                    onClick={copyLink}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    复制链接
                  </button>
                  <button
                    onClick={openLink}
                    className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    打开登录
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Callback URL */}
          {provider.supportsCallback && state.url && state.status !== 'success' && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">回调 URL</p>
                <p className="text-xs text-gray-500 mt-1">登录完成后，将浏览器地址栏的 URL 粘贴到这里</p>
              </div>
              <input
                type="text"
                value={state.callbackUrl || ''}
                onChange={e => onCallbackUrlChange(e.target.value)}
                placeholder="粘贴登录后的回调 URL"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:bg-white transition-all"
              />
              <button
                onClick={onSubmitCallback}
                disabled={state.callbackSubmitting || !state.callbackUrl?.trim()}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {state.callbackSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                提交回调
              </button>
              {state.callbackStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  回调提交成功
                </div>
              )}
              {state.callbackStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <XCircle className="w-4 h-4" />
                  {state.callbackError || '提交失败'}
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {state.status === 'success' && (
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-base font-medium text-green-700">认证成功</p>
              <p className="text-sm text-green-600 mt-1">凭证已保存</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors cursor-pointer"
          >
            {state.status === 'success' ? '完成' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  )
}
