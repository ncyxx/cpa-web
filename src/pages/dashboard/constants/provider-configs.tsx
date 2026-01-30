/**
 * Provider Configuration Constants
 * Centralized provider metadata and styling
 */

import { Zap, Sparkles, Code2, MessageSquare, Cpu, Bot, Workflow, GitBranch, Layers } from 'lucide-react'
import type { ProviderType } from '@/services/api/providers'

export interface ProviderConfig {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  link: string
  showDetailedStats?: boolean
}

export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  kiro: {
    title: 'Kiro',
    sub: 'AWS CodeWhisperer',
    icon: <Zap className="w-5 h-5" />,
    bg: 'bg-violet-100',
    color: 'text-violet-600',
    headerBg: 'from-violet-50 to-purple-50',
    link: '/kiro-tokens',
    showDetailedStats: true // Kiro has full stats support
  },
  gemini: {
    title: 'Gemini',
    sub: 'Google AI',
    icon: <Sparkles className="w-5 h-5" />,
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    headerBg: 'from-blue-50 to-cyan-50',
    link: '/ai-providers'
  },
  codex: {
    title: 'Codex',
    sub: 'OpenAI Codex',
    icon: <Code2 className="w-5 h-5" />,
    bg: 'bg-emerald-100',
    color: 'text-emerald-600',
    headerBg: 'from-emerald-50 to-green-50',
    link: '/ai-providers'
  },
  claude: {
    title: 'Claude',
    sub: 'Anthropic',
    icon: <MessageSquare className="w-5 h-5" />,
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    headerBg: 'from-orange-50 to-amber-50',
    link: '/ai-providers'
  },
  openai: {
    title: 'OpenAI',
    sub: 'GPT Models',
    icon: <Cpu className="w-5 h-5" />,
    bg: 'bg-slate-100',
    color: 'text-slate-600',
    headerBg: 'from-slate-50 to-gray-50',
    link: '/ai-providers'
  },
  qwen: {
    title: 'Qwen',
    sub: 'Alibaba Cloud',
    icon: <Layers className="w-5 h-5" />,
    bg: 'bg-indigo-100',
    color: 'text-indigo-600',
    headerBg: 'from-indigo-50 to-blue-50',
    link: '/ai-providers'
  },
  copilot: {
    title: 'Copilot',
    sub: 'GitHub Copilot',
    icon: <GitBranch className="w-5 h-5" />,
    bg: 'bg-gray-100',
    color: 'text-gray-700',
    headerBg: 'from-gray-50 to-slate-50',
    link: '/ai-providers'
  },
  iflow: {
    title: 'iFlow',
    sub: 'iFlow AI',
    icon: <Workflow className="w-5 h-5" />,
    bg: 'bg-teal-100',
    color: 'text-teal-600',
    headerBg: 'from-teal-50 to-cyan-50',
    link: '/ai-providers'
  }
}

export function getProviderConfig(provider: ProviderType): ProviderConfig {
  return PROVIDER_CONFIGS[provider] || {
    title: provider,
    sub: 'Provider',
    icon: <Bot className="w-5 h-5" />,
    bg: 'bg-gray-100',
    color: 'text-gray-600',
    headerBg: 'from-gray-50 to-slate-50',
    link: '/ai-providers'
  }
}

// Provider display order
export const PROVIDER_ORDER: ProviderType[] = [
  'kiro',
  'gemini',
  'codex',
  'claude',
  'openai',
  'qwen',
  'copilot',
  'iflow'
]
