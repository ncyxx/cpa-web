/**
 * OAuth 登录页面
 * 所有输入都在模态框中
 */

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { PROVIDERS, type ProviderConfig, type KiroAuthMethod } from './constants'
import { useOAuthProviders, useIFlowCookie, useVertexImport } from './hooks'
import { ProviderCard, VertexCard, IFlowCookieCard, OAuthModal, VertexModal, IFlowModal } from './components'

type ModalType = 'oauth' | 'vertex' | 'iflow' | null

export function OAuthPage() {
  const { getState, startAuth, submitCallback, setProjectId, setAuthMethod, setCallbackUrl } = useOAuthProviders()
  const iflow = useIFlowCookie()
  const vertex = useVertexImport()

  const [modalType, setModalType] = useState<ModalType>(null)
  const [activeProvider, setActiveProvider] = useState<ProviderConfig | null>(null)

  const handleOpenOAuthModal = (provider: ProviderConfig) => {
    setActiveProvider(provider)
    setModalType('oauth')
    // 如果不需要 Project ID 和认证方式选择，直接开始认证
    if (!provider.requiresProjectId && !provider.requiresAuthMethod) {
      startAuth(provider.id)
    }
  }

  const handleStartAuth = (method?: KiroAuthMethod) => {
    if (activeProvider) {
      startAuth(activeProvider.id, method)
    }
  }

  const handleCloseModal = () => {
    setModalType(null)
    setActiveProvider(null)
  }

  return (
    <div className="space-y-4">
      {/* 头部卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">OAuth 认证</h2>
              <p className="text-xs text-gray-500 mt-0.5">通过 OAuth 登录获取各平台凭证</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            支持 {PROVIDERS.length + 2} 个平台
          </div>
        </div>
      </div>

      {/* 所有卡片 - 统一网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {PROVIDERS.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            state={getState(provider.id)}
            onStartAuth={() => handleOpenOAuthModal(provider)}
          />
        ))}
        <VertexCard
          loading={vertex.loading}
          result={vertex.result}
          onOpenModal={() => setModalType('vertex')}
        />
        <IFlowCookieCard
          loading={iflow.loading}
          result={iflow.result}
          onOpenModal={() => setModalType('iflow')}
        />
      </div>

      {/* OAuth 模态框 */}
      <OAuthModal
        isOpen={modalType === 'oauth'}
        onClose={handleCloseModal}
        provider={activeProvider}
        state={activeProvider ? getState(activeProvider.id) : { status: 'idle', polling: false }}
        onProjectIdChange={(v) => activeProvider && setProjectId(activeProvider.id, v)}
        onAuthMethodChange={(m) => activeProvider && setAuthMethod(activeProvider.id, m)}
        onCallbackUrlChange={(v) => activeProvider && setCallbackUrl(activeProvider.id, v)}
        onSubmitCallback={() => activeProvider && submitCallback(activeProvider.id)}
        onStartAuth={handleStartAuth}
      />

      {/* Vertex 模态框 */}
      <VertexModal
        isOpen={modalType === 'vertex'}
        onClose={handleCloseModal}
        file={vertex.file}
        location={vertex.location}
        loading={vertex.loading}
        result={vertex.result}
        error={vertex.error}
        onFileChange={vertex.setFile}
        onLocationChange={vertex.setLocation}
        onSubmit={vertex.submit}
      />

      {/* iFlow 模态框 */}
      <IFlowModal
        isOpen={modalType === 'iflow'}
        onClose={handleCloseModal}
        cookie={iflow.cookie}
        loading={iflow.loading}
        result={iflow.result}
        error={iflow.error}
        onCookieChange={iflow.setCookie}
        onSubmit={iflow.submit}
      />
    </div>
  )
}
