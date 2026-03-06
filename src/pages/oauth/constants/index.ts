/**
 * OAuth 页面常量
 */

export type OAuthProvider = 'codex' | 'anthropic' | 'antigravity' | 'gemini-cli' | 'qwen' | 'iflow'

export interface ProviderConfig {
  id: OAuthProvider
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
  supportsCallback: boolean
  requiresProjectId?: boolean
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'codex',
    name: 'OpenAI Codex',
    description: '通过 OpenAI OAuth 登录获取 Codex 凭证',
    icon: 'openai',
    color: 'text-gray-900',
    bgColor: 'bg-gray-100',
    supportsCallback: true
  },
  {
    id: 'anthropic',
    name: 'Claude',
    description: '通过 Anthropic OAuth 登录获取 Claude 凭证',
    icon: 'claude',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    supportsCallback: true
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    description: '通过 Antigravity OAuth 登录',
    icon: 'antigravity',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    supportsCallback: true
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    description: '通过 Google OAuth 登录获取 Gemini CLI 凭证',
    icon: 'gemini',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    supportsCallback: true,
    requiresProjectId: true
  },
  {
    id: 'qwen',
    name: 'Qwen',
    description: '通过阿里云 OAuth 登录获取 Qwen 凭证',
    icon: 'qwen',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    supportsCallback: false
  },
  {
    id: 'iflow',
    name: 'iFlow',
    description: '通过 iFlow OAuth 登录',
    icon: 'iflow',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    supportsCallback: true
  }
]
