/**
 * Provider Aggregator Service
 * Aggregates data from all providers into unified format
 */

import { kiroProviderApi, type KiroToken } from '../kiro'
import { geminiProviderApi } from '../gemini'
import { codexProviderApi } from '../codex'
import { claudeProviderApi } from '../claude'
import { openaiProviderApi } from '../openai'
import type { ProviderData, ProviderStats, ProviderAccount, ProviderType, ProviderStatus } from '../types'

function normalizeKiroAccount(token: KiroToken): ProviderAccount {
  const status = token.status?.toLowerCase() || 'active'
  let normalizedStatus: ProviderStatus = 'active'

  if (status === 'healthy' || status === 'valid' || status === 'active') {
    normalizedStatus = 'healthy'
  } else if (status === 'exhausted') {
    normalizedStatus = 'exhausted'
  } else if (status === 'expired') {
    normalizedStatus = 'expired'
  } else {
    normalizedStatus = 'unhealthy'
  }

  return {
    id: token.id,
    name: token.name,
    email: token.email,
    status: normalizedStatus,
    statusMessage: token.status_message,
    currentUsage: token.current_usage,
    usageLimit: token.usage_limit,
    subscriptionTitle: token.subscription_title,
    nextReset: token.next_reset,
    expiresAt: token.expires_at,
    isExpired: token.is_expired,
    lastRefresh: token.last_refresh,
    createdAt: token.created_at,
    updatedAt: token.updated_at,
    successCount: token.success_count,
    failureCount: token.failure_count,
    successRate: token.success_rate,
    metadata: { provider: token.provider, authMethod: token.auth_method, profileArn: token.profile_arn }
  }
}


function calculateStats(accounts: ProviderAccount[]): ProviderStats {
  const stats: ProviderStats = {
    total: accounts.length,
    healthy: 0,
    unhealthy: 0,
    exhausted: 0,
    expired: 0,
    totalUsage: 0,
    totalLimit: 0,
    proCount: 0,
    successCount: 0,
    failureCount: 0
  }

  accounts.forEach(account => {
    if (account.status === 'healthy' || account.status === 'active') {
      stats.healthy++
    } else if (account.status === 'exhausted') {
      stats.exhausted++
    } else if (account.status === 'expired') {
      stats.expired = (stats.expired || 0) + 1
    } else {
      stats.unhealthy++
    }

    if (account.currentUsage !== undefined) {
      stats.totalUsage = (stats.totalUsage || 0) + account.currentUsage
    }
    if (account.usageLimit !== undefined) {
      stats.totalLimit = (stats.totalLimit || 0) + account.usageLimit
    }

    const subTitle = (account.subscriptionTitle || '').toLowerCase()
    if (subTitle.includes('pro') || subTitle.includes('premium')) {
      stats.proCount = (stats.proCount || 0) + 1
    }

    if (account.successCount !== undefined) {
      stats.successCount = (stats.successCount || 0) + account.successCount
    }
    if (account.failureCount !== undefined) {
      stats.failureCount = (stats.failureCount || 0) + account.failureCount
    }
  })

  const totalRequests = (stats.successCount || 0) + (stats.failureCount || 0)
  if (totalRequests > 0) {
    stats.successRate = Math.round(((stats.successCount || 0) / totalRequests) * 100)
  }

  return stats
}


async function fetchKiroData(): Promise<ProviderData> {
  try {
    const response = await kiroProviderApi.listTokens()
    const accounts = response.tokens.map(normalizeKiroAccount)
    const stats = calculateStats(accounts)
    return { provider: 'kiro', accounts, stats, lastUpdated: new Date().toISOString() }
  } catch (error) {
    return {
      provider: 'kiro',
      accounts: [],
      stats: { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch Kiro data'
    }
  }
}

async function fetchGeminiData(): Promise<ProviderData> {
  try {
    const configs = await geminiProviderApi.getKeys()
    const accounts: ProviderAccount[] = configs.map((config, index) => ({
      id: `gemini-${index}`,
      name: config.apiKey.substring(0, 20) + '...',
      status: 'active',
      metadata: { prefix: config.prefix, baseUrl: config.baseUrl }
    }))
    return {
      provider: 'gemini',
      accounts,
      stats: { total: accounts.length, healthy: accounts.length, unhealthy: 0, exhausted: 0 },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return {
      provider: 'gemini',
      accounts: [],
      stats: { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch Gemini data'
    }
  }
}

async function fetchCodexData(): Promise<ProviderData> {
  try {
    const configs = await codexProviderApi.getConfigs()
    const accounts: ProviderAccount[] = configs.map((config, index) => ({
      id: `codex-${index}`,
      name: config.apiKey.substring(0, 20) + '...',
      status: 'active',
      metadata: { prefix: config.prefix, baseUrl: config.baseUrl }
    }))
    return {
      provider: 'codex',
      accounts,
      stats: { total: accounts.length, healthy: accounts.length, unhealthy: 0, exhausted: 0 },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return {
      provider: 'codex',
      accounts: [],
      stats: { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch Codex data'
    }
  }
}


async function fetchClaudeData(): Promise<ProviderData> {
  try {
    const configs = await claudeProviderApi.getConfigs()
    const accounts: ProviderAccount[] = configs.map((config, index) => ({
      id: `claude-${index}`,
      name: config.apiKey.substring(0, 20) + '...',
      status: 'active',
      metadata: { prefix: config.prefix, baseUrl: config.baseUrl }
    }))
    return {
      provider: 'claude',
      accounts,
      stats: { total: accounts.length, healthy: accounts.length, unhealthy: 0, exhausted: 0 },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return {
      provider: 'claude',
      accounts: [],
      stats: { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch Claude data'
    }
  }
}

async function fetchOpenAIData(): Promise<ProviderData> {
  try {
    const providers = await openaiProviderApi.getProviders()
    const accounts: ProviderAccount[] = providers.map((provider, index) => ({
      id: `openai-${index}`,
      name: provider.name,
      status: 'active',
      metadata: { baseUrl: provider.baseUrl, apiKeyCount: provider.apiKeyEntries?.length || 0 }
    }))
    return {
      provider: 'openai',
      accounts,
      stats: { total: accounts.length, healthy: accounts.length, unhealthy: 0, exhausted: 0 },
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    return {
      provider: 'openai',
      accounts: [],
      stats: { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 },
      error: error instanceof Error ? error.message : 'Failed to fetch OpenAI data'
    }
  }
}


const emptyStats = { total: 0, healthy: 0, unhealthy: 0, exhausted: 0 }

export async function fetchAllProviderData(): Promise<Record<ProviderType, ProviderData>> {
  const [kiro, gemini, codex, claude, openai] = await Promise.allSettled([
    fetchKiroData(),
    fetchGeminiData(),
    fetchCodexData(),
    fetchClaudeData(),
    fetchOpenAIData()
  ])

  return {
    kiro: kiro.status === 'fulfilled' ? kiro.value : { provider: 'kiro', accounts: [], stats: emptyStats, error: 'Failed to fetch' },
    gemini: gemini.status === 'fulfilled' ? gemini.value : { provider: 'gemini', accounts: [], stats: emptyStats, error: 'Failed to fetch' },
    codex: codex.status === 'fulfilled' ? codex.value : { provider: 'codex', accounts: [], stats: emptyStats, error: 'Failed to fetch' },
    claude: claude.status === 'fulfilled' ? claude.value : { provider: 'claude', accounts: [], stats: emptyStats, error: 'Failed to fetch' },
    openai: openai.status === 'fulfilled' ? openai.value : { provider: 'openai', accounts: [], stats: emptyStats, error: 'Failed to fetch' },
    qwen: { provider: 'qwen', accounts: [], stats: emptyStats },
    copilot: { provider: 'copilot', accounts: [], stats: emptyStats },
    iflow: { provider: 'iflow', accounts: [], stats: emptyStats }
  }
}

export async function fetchProviderData(provider: ProviderType): Promise<ProviderData> {
  switch (provider) {
    case 'kiro': return fetchKiroData()
    case 'gemini': return fetchGeminiData()
    case 'codex': return fetchCodexData()
    case 'claude': return fetchClaudeData()
    case 'openai': return fetchOpenAIData()
    default: return { provider, accounts: [], stats: emptyStats, error: 'Provider not implemented' }
  }
}
