/**
 * OAuth Provider 卡片 - 只显示基本信息和按钮
 */

import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import type { ProviderConfig } from '../../constants'
import type { ProviderState } from '../../hooks'

// 导入 SVG 图标
import iconClaude from '@/assets/icons/claude.svg'
import iconGemini from '@/assets/icons/gemini.svg'
import iconOpenaiLight from '@/assets/icons/openai-light.svg'
import iconQwen from '@/assets/icons/qwen.svg'
import iconKiro from '@/assets/icons/kiro.svg'
import iconIflow from '@/assets/icons/iflow.svg'
import iconAntigravity from '@/assets/icons/antigravity.svg'

// 图标映射
const ICON_MAP: Record<string, string> = {
  openai: iconOpenaiLight,
  claude: iconClaude,
  antigravity: iconAntigravity,
  gemini: iconGemini,
  qwen: iconQwen,
  iflow: iconIflow,
  kiro: iconKiro,
}

interface ProviderCardProps {
  provider: ProviderConfig
  state: ProviderState
  onStartAuth: () => void
}

export function ProviderCard({ provider, state, onStartAuth }: ProviderCardProps) {
  const iconSrc = ICON_MAP[provider.icon]

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col justify-center">
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${provider.bgColor} flex items-center justify-center shrink-0`}>
            {iconSrc ? (
              <img src={iconSrc} alt={provider.name} className="w-5 h-5" />
            ) : (
              <span className={`text-lg font-bold ${provider.color}`}>
                {provider.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
          </div>
        </div>
        
        {state.status === 'success' ? (
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium shrink-0 ml-3">
            <CheckCircle className="w-4 h-4" />
            已认证
          </div>
        ) : state.status === 'error' ? (
          <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium shrink-0 ml-3">
            <XCircle className="w-4 h-4" />
            失败
          </div>
        ) : (
          <button
            onClick={onStartAuth}
            disabled={state.polling}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-3"
          >
            {state.polling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            登录
          </button>
        )}
      </div>
    </div>
  )
}
