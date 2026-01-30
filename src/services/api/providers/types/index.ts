/**
 * Provider Types Module
 * Common interfaces for all provider data
 */

// ============ Base Types ============

export interface ModelAlias {
  name: string
  alias?: string
  priority?: number
  testModel?: string
}

export interface ApiKeyEntry {
  apiKey: string
  proxyUrl?: string
  headers?: Record<string, string>
}

export interface ProviderKeyConfig {
  apiKey: string
  prefix?: string
  baseUrl?: string
  proxyUrl?: string
  headers?: Record<string, string>
  models?: ModelAlias[]
  excludedModels?: string[]
}

export interface GeminiKeyConfig {
  apiKey: string
  prefix?: string
  baseUrl?: string
  headers?: Record<string, string>
  excludedModels?: string[]
}

export interface OpenAIProviderConfig {
  name: string
  baseUrl: string
  prefix?: string
  headers?: Record<string, string>
  apiKeyEntries: ApiKeyEntry[]
  models?: ModelAlias[]
  priority?: number
  testModel?: string
}

// ============ Unified Provider Types ============

export type ProviderType = 'kiro' | 'gemini' | 'codex' | 'claude' | 'openai' | 'qwen' | 'copilot' | 'iflow'

export type ProviderStatus = 'active' | 'healthy' | 'unhealthy' | 'exhausted' | 'expired' | 'error'

export interface ProviderStats {
  total: number
  healthy: number
  unhealthy: number
  exhausted: number
  expired?: number
  totalUsage?: number
  totalLimit?: number
  proCount?: number
  successCount?: number
  failureCount?: number
  successRate?: number
}

export interface ProviderAccount {
  id: string
  name?: string
  email?: string
  status: ProviderStatus
  statusMessage?: string
  currentUsage?: number
  usageLimit?: number
  subscriptionTitle?: string
  nextReset?: string
  expiresAt?: string
  isExpired?: boolean
  lastRefresh?: string
  createdAt?: string
  updatedAt?: string
  successCount?: number
  failureCount?: number
  successRate?: number
  metadata?: Record<string, any>
}

export interface ProviderData {
  provider: ProviderType
  accounts: ProviderAccount[]
  stats: ProviderStats
  lastUpdated?: string
  error?: string
}
