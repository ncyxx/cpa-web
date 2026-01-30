/**
 * AI 提供商配置常量
 */

import { Sparkles, Code2, MessageSquare, Cpu, Terminal, Zap, type LucideIcon } from 'lucide-react'

export type ProviderType = 'gemini' | 'codex' | 'claude' | 'openai' | 'ampcode' | 'kiro'

export interface ProviderConfig {
  type: ProviderType
  title: string
  sub: string
  icon: LucideIcon
  bg: string
  color: string
  gradientBg: string
  headerBg: string
}

export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  gemini: {
    type: 'gemini',
    title: 'Gemini',
    sub: 'Google AI',
    icon: Sparkles,
    bg: 'bg-blue-500',
    color: 'text-blue-600',
    gradientBg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    headerBg: 'from-blue-50 to-cyan-50'
  },
  codex: {
    type: 'codex',
    title: 'Codex',
    sub: 'OpenAI Codex',
    icon: Code2,
    bg: 'bg-emerald-500',
    color: 'text-emerald-600',
    gradientBg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    headerBg: 'from-emerald-50 to-green-50'
  },
  claude: {
    type: 'claude',
    title: 'Claude',
    sub: 'Anthropic',
    icon: MessageSquare,
    bg: 'bg-orange-500',
    color: 'text-orange-600',
    gradientBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    headerBg: 'from-orange-50 to-amber-50'
  },
  openai: {
    type: 'openai',
    title: 'OpenAI',
    sub: 'GPT Models',
    icon: Cpu,
    bg: 'bg-slate-700',
    color: 'text-slate-600',
    gradientBg: 'bg-gradient-to-br from-slate-50 to-gray-100',
    headerBg: 'from-slate-50 to-gray-100'
  },
  ampcode: {
    type: 'ampcode',
    title: 'Amp CLI',
    sub: 'ampcode 集成',
    icon: Terminal,
    bg: 'bg-gradient-to-br from-red-500 to-orange-500',
    color: 'text-red-600',
    gradientBg: 'bg-gradient-to-br from-red-50 to-orange-50',
    headerBg: 'from-red-50 to-orange-50'
  },
  kiro: {
    type: 'kiro',
    title: 'Kiro',
    sub: 'AWS CodeWhisperer',
    icon: Zap,
    bg: 'bg-violet-500',
    color: 'text-violet-600',
    gradientBg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    headerBg: 'from-violet-50 to-purple-50'
  }
}

export const PROVIDER_ORDER: ProviderType[] = ['gemini', 'codex', 'claude', 'openai', 'ampcode', 'kiro']
