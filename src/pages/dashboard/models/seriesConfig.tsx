/**
 * 模型系列配置
 * 基于后端 model_definitions_*.go 文件中的所有模型定义
 */

import React from 'react'

// 导入SVG图标
import iconClaude from '@/assets/icons/claude.svg'
import iconGemini from '@/assets/icons/gemini.svg'
import iconOpenaiLight from '@/assets/icons/openai-light.svg'
import iconQwen from '@/assets/icons/qwen.svg'
import iconKiro from '@/assets/icons/kiro.svg'
import iconIflow from '@/assets/icons/iflow.svg'
import iconAmp from '@/assets/icons/amp.svg'

export interface ModelSeriesConfig {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  models?: string[]
}

// 图标组件
const IconImg = ({ src, alt }: { src: string; alt: string }) => (
  <img src={src} alt={alt} className="w-5 h-5" />
)

// 文字图标（用于没有SVG的系列）
const TextIcon = ({ text }: { text: string }) => (
  <span className="text-lg font-bold">{text}</span>
)

export const MODEL_SERIES_CONFIG: Record<string, ModelSeriesConfig> = {
  claude: {
    title: 'Claude',
    sub: 'Anthropic Claude 系列',
    icon: <IconImg src={iconClaude} alt="Claude" />,
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    headerBg: 'from-orange-50 to-white',
    models: [
      'claude-sonnet-4.5',
      'claude-opus-4.5',
      'claude-haiku-4.5',
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-5-20251101',
      'claude-haiku-4-5-20251001',
      'gemini-claude-sonnet-4-5-thinking',
      'gemini-claude-opus-4-5-thinking',
    ]
  },
  gemini: {
    title: 'Gemini',
    sub: 'Google Gemini 系列',
    icon: <IconImg src={iconGemini} alt="Gemini" />,
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    headerBg: 'from-blue-50 to-white',
    models: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3-pro-image-preview',
      'gemini-2.5-flash-image',
      'gemini-2.5-computer-use-preview-10-2025',
      'gemini-pro-latest',
      'gemini-flash-latest',
    ]
  },
  gpt: {
    title: 'GPT',
    sub: 'OpenAI GPT 系列',
    icon: <IconImg src={iconOpenaiLight} alt="OpenAI" />,
    bg: 'bg-green-100',
    color: 'text-green-600',
    headerBg: 'from-green-50 to-white',
    models: [
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-codex',
      'gpt-5-codex-mini',
      'gpt-5.1',
      'gpt-5.1-codex',
      'gpt-5.1-codex-mini',
      'gpt-5.1-codex-max',
      'gpt-5.2',
      'gpt-5.2-codex',
      'gpt-4.1',
    ]
  },
  qwen: {
    title: 'Qwen',
    sub: '阿里通义千问系列',
    icon: <IconImg src={iconQwen} alt="Qwen" />,
    bg: 'bg-indigo-100',
    color: 'text-indigo-600',
    headerBg: 'from-indigo-50 to-white',
    models: [
      'qwen3-coder-plus',
      'qwen3-coder-flash',
      'qwen3-max',
      'qwen3-max-preview',
      'qwen3-vl-plus',
      'qwen3-32b',
      'qwen3-235b',
      'qwen3-235b-a22b-instruct',
      'qwen3-235b-a22b-thinking-2507',
    ]
  },
  deepseek: {
    title: 'DeepSeek',
    sub: 'DeepSeek 系列',
    icon: <TextIcon text="D" />,
    bg: 'bg-cyan-100',
    color: 'text-cyan-600',
    headerBg: 'from-cyan-50 to-white',
    models: [
      'deepseek-v3',
      'deepseek-v3.1',
      'deepseek-v3.2',
      'deepseek-v3.2-chat',
      'deepseek-v3.2-reasoner',
      'deepseek-r1',
    ]
  },
  kimi: {
    title: 'Kimi',
    sub: 'Moonshot Kimi 系列',
    icon: <IconImg src={iconKiro} alt="Kimi" />,
    bg: 'bg-violet-100',
    color: 'text-violet-600',
    headerBg: 'from-violet-50 to-white',
    models: [
      'kimi-k2',
      'kimi-k2-0905',
      'kimi-k2-thinking',
    ]
  },
  glm: {
    title: 'GLM',
    sub: '智谱 GLM 系列',
    icon: <TextIcon text="Z" />,
    bg: 'bg-rose-100',
    color: 'text-rose-600',
    headerBg: 'from-rose-50 to-white',
    models: [
      'glm-4.6',
      'glm-4.7',
    ]
  },
  minimax: {
    title: 'MiniMax',
    sub: 'MiniMax 系列',
    icon: <TextIcon text="M" />,
    bg: 'bg-amber-100',
    color: 'text-amber-600',
    headerBg: 'from-amber-50 to-white',
    models: [
      'minimax-m2',
      'minimax-m2.1',
    ]
  },
  grok: {
    title: 'Grok',
    sub: 'xAI Grok 系列',
    icon: <TextIcon text="X" />,
    bg: 'bg-slate-100',
    color: 'text-slate-600',
    headerBg: 'from-slate-50 to-white',
    models: [
      'grok-code-fast-1',
    ]
  },
  amazonq: {
    title: 'Amazon Q',
    sub: 'AWS Amazon Q 系列',
    icon: <IconImg src={iconAmp} alt="Amazon Q" />,
    bg: 'bg-yellow-100',
    color: 'text-yellow-700',
    headerBg: 'from-yellow-50 to-white',
    models: [
      'amazonq-auto',
      'amazonq-claude-opus-4.5',
      'amazonq-claude-sonnet-4.5',
      'amazonq-claude-sonnet-4',
      'amazonq-claude-haiku-4.5',
    ]
  },
  iflow: {
    title: 'iFlow',
    sub: 'iFlow TStars 系列',
    icon: <IconImg src={iconIflow} alt="iFlow" />,
    bg: 'bg-teal-100',
    color: 'text-teal-600',
    headerBg: 'from-teal-50 to-white',
    models: [
      'tstars2.0',
    ]
  },
  other: {
    title: '其他',
    sub: '其他模型',
    icon: <TextIcon text="?" />,
    bg: 'bg-gray-100',
    color: 'text-gray-600',
    headerBg: 'from-gray-50 to-white',
    models: [
      'raptor-mini',
      'vision-model',
    ]
  }
}

// 模型系列显示顺序
export const MODEL_SERIES_ORDER = [
  'claude',
  'gemini', 
  'gpt',
  'qwen',
  'deepseek',
  'kimi',
  'glm',
  'minimax',
  'grok',
  'amazonq',
  'iflow',
  'other'
]
