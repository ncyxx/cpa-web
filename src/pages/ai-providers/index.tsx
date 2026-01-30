/**
 * AI 提供商页面
 * Bento Grid Style - Apple Design System
 */

import { useState, useMemo } from 'react'
import { Bot, Check, Settings2 } from 'lucide-react'
import { useAuthStore, useConfigStore } from '@/stores'
import { PROVIDER_CONFIGS, PROVIDER_ORDER, type ProviderType } from './constants'
import { GeminiProvider, CodexProvider, ClaudeProvider, OpenAIProvider, AmpcodeProvider, KiroProvider } from './providers'

function StatCard({ icon, label, value, bg, color, gradientBg }: {
  icon: React.ReactNode
  label: string
  value: string | number
  bg: string
  color: string
  gradientBg: string
}) {
  return (
    <div className={`rounded-xl border border-gray-100 p-4 ${gradientBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className={`text-xs font-medium ${color} block`}>{label}</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function TabButton({ config, active, count, onClick }: {
  config: typeof PROVIDER_CONFIGS[ProviderType]
  active: boolean
  count: number
  onClick: () => void
}) {
  const Icon = config.icon
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
        active ? `${config.bg} text-white shadow-md` : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{config.title}</span>
      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
        {count}
      </span>
    </button>
  )
}

export function AIProvidersPage() {
  const connectionStatus = useAuthStore((state) => state.connectionStatus)
  const config = useConfigStore((state) => state.config)
  const [activeTab, setActiveTab] = useState<ProviderType>('gemini')

  const counts = useMemo(() => ({
    gemini: config?.geminiApiKeys?.length || 0,
    codex: config?.codexApiKeys?.length || 0,
    claude: config?.claudeApiKeys?.length || 0,
    openai: config?.openaiCompatibility?.length || 0,
    ampcode: 0,
    kiro: 0
  }), [config])

  const totalKeys = counts.gemini + counts.codex + counts.claude + counts.openai
  const activeConfig = PROVIDER_CONFIGS[activeTab]

  const renderProvider = () => {
    switch (activeTab) {
      case 'gemini': return <GeminiProvider />
      case 'codex': return <CodexProvider />
      case 'claude': return <ClaudeProvider />
      case 'openai': return <OpenAIProvider />
      case 'ampcode': return <AmpcodeProvider />
      case 'kiro': return <KiroProvider />
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<Bot className="w-4 h-4" />} label="提供商总数" value={6} bg="bg-purple-500" color="text-purple-600" gradientBg="bg-gradient-to-br from-purple-50 to-purple-100/50" />
        <StatCard icon={<Settings2 className="w-4 h-4" />} label="配置总数" value={totalKeys} bg="bg-blue-500" color="text-blue-600" gradientBg="bg-gradient-to-br from-blue-50 to-blue-100/50" />
        <StatCard
          icon={<Check className="w-4 h-4" />}
          label="连接状态"
          value={connectionStatus === 'connected' ? '已连接' : '未连接'}
          bg={connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}
          color={connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}
          gradientBg={connectionStatus === 'connected' ? 'bg-gradient-to-br from-green-50 to-green-100/50' : 'bg-gradient-to-br from-red-50 to-red-100/50'}
        />
        <StatCard icon={<activeConfig.icon className="w-4 h-4" />} label="当前查看" value={activeConfig.title} bg={activeConfig.bg} color={activeConfig.color} gradientBg={activeConfig.gradientBg} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {PROVIDER_ORDER.map(type => (
              <TabButton key={type} config={PROVIDER_CONFIGS[type]} active={activeTab === type} count={counts[type]} onClick={() => setActiveTab(type)} />
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">{renderProvider()}</div>
      </div>
    </div>
  )
}
