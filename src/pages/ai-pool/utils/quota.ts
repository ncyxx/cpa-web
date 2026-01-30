/**
 * 配额相关工具函数和常量
 */

import type { AuthFile } from '@/services/api'

// Codex 配额 URL 和请求头
export const CODEX_USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'
export const CODEX_REQUEST_HEADERS: Record<string, string> = {
  'Authorization': 'Bearer $TOKEN$',
  'Content-Type': 'application/json',
  'User-Agent': 'codex_cli_rs/0.76.0 (Debian 13.0.0; x86_64) WindowsTerminal'
}

// Gemini CLI 配额 URL 和请求头
export const GEMINI_CLI_QUOTA_URL = 'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota'
export const GEMINI_CLI_REQUEST_HEADERS: Record<string, string> = {
  'Authorization': 'Bearer $TOKEN$',
  'Content-Type': 'application/json'
}

// Antigravity 配额 URL 和请求头
export const ANTIGRAVITY_QUOTA_URLS = [
  'https://daily-cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels',
  'https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:fetchAvailableModels',
  'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels'
]
export const ANTIGRAVITY_REQUEST_HEADERS: Record<string, string> = {
  'Authorization': 'Bearer $TOKEN$',
  'Content-Type': 'application/json',
  'User-Agent': 'antigravity/1.11.5 windows/amd64'
}

// 类型定义
export interface CodexQuotaWindow {
  id: string
  label: string
  usedPercent: number | null
  resetLabel: string
}

export interface CodexQuotaData {
  planType: string | null
  windows: CodexQuotaWindow[]
}

export interface GeminiCliBucket {
  id: string
  label: string
  remainingFraction: number | null
  remainingAmount: number | null
  resetTime?: string
  modelIds?: string[]
  tokenType?: string
}

export interface AntigravityGroup {
  id: string
  label: string
  models: string[]
  remainingFraction: number
  resetTime?: string
}

// 工具函数
export const normalizeStringValue = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

export const normalizeNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number' && !isNaN(value)) return value
  if (typeof value === 'string') {
    const num = parseFloat(value)
    if (!isNaN(num)) return num
  }
  return null
}

export const normalizePlanType = (value: unknown): string | null => {
  const str = normalizeStringValue(value)
  if (!str) return null
  const lower = str.toLowerCase()
  if (lower === 'plus' || lower === 'chatgpt-plus') return 'plus'
  if (lower === 'team' || lower === 'chatgpt-team') return 'team'
  if (lower === 'free' || lower === 'chatgpt-free') return 'free'
  return str
}

// 解析 JWT id_token
export const parseIdTokenPayload = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'string') return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1]))
    return typeof payload === 'object' && payload !== null ? payload : null
  } catch {
    return null
  }
}

// 解析 Codex ChatGPT Account ID
export const resolveCodexChatgptAccountId = (file: AuthFile): string | null => {
  // 直接从 file 获取
  const directId = normalizeStringValue(
    (file as any).account_id ?? (file as any).accountId
  )
  if (directId) return directId

  // 从 metadata 获取
  const metadata = file.metadata as Record<string, unknown> | undefined
  if (metadata) {
    const metaId = normalizeStringValue(metadata.account_id ?? metadata.accountId)
    if (metaId) return metaId
  }

  // 从 id_token 解析
  const idToken = (file as any).id_token ?? metadata?.id_token
  if (idToken) {
    const payload = parseIdTokenPayload(idToken)
    if (payload) {
      const tokenId = normalizeStringValue(payload.chatgpt_account_id ?? payload.chatgptAccountId)
      if (tokenId) return tokenId
    }
  }

  return null
}

// 解析 Codex Plan Type
export const resolveCodexPlanType = (file: AuthFile): string | null => {
  const metadata = file.metadata as Record<string, unknown> | undefined
  
  const candidates = [
    (file as any).plan_type,
    (file as any).planType,
    metadata?.plan_type,
    metadata?.planType
  ]

  for (const candidate of candidates) {
    const planType = normalizePlanType(candidate)
    if (planType) return planType
  }

  // 从 id_token 解析
  const idToken = (file as any).id_token ?? metadata?.id_token
  if (idToken) {
    const payload = parseIdTokenPayload(idToken)
    if (payload) {
      const tokenPlan = normalizePlanType(payload.plan_type ?? payload.planType)
      if (tokenPlan) return tokenPlan
    }
  }

  return null
}

// 解析 Gemini CLI Project ID
export const resolveGeminiCliProjectId = (file: AuthFile): string | null => {
  const metadata = file.metadata as Record<string, unknown> | undefined
  
  const candidates = [
    (file as any).account,
    metadata?.account
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const matches = Array.from(candidate.matchAll(/\(([^()]+)\)/g))
      if (matches.length > 0) {
        const projectId = matches[matches.length - 1]?.[1]?.trim()
        if (projectId) return projectId
      }
    }
  }

  return null
}

// 格式化重置时间
export const formatResetTime = (resetTime?: string): string => {
  if (!resetTime) return '-'
  try {
    const date = new Date(resetTime)
    if (isNaN(date.getTime())) return '-'
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    if (diff <= 0) return '已重置'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}天后`
    }
    if (hours > 0) return `${hours}小时${minutes}分后`
    return `${minutes}分钟后`
  } catch {
    return '-'
  }
}

// 格式化 Codex 重置标签
export const formatCodexResetLabel = (window: any): string => {
  const resetAt = window?.reset_at ?? window?.resetAt
  if (!resetAt) return '-'
  return formatResetTime(resetAt)
}


// Kiro 配额类型
export interface KiroQuotaData {
  name: string
  email?: string
  provider?: string
  currentUsage: number
  usageLimit: number
  subscriptionTitle?: string
  nextReset?: string
  status: 'ok' | 'error' | 'expired'
  errorMessage?: string
}
