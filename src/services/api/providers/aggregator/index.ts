/**
 * Provider Aggregator Service
 * Aggregates data from all providers into unified format
 */

import { geminiProviderApi } from '../gemini'
import { codexProviderApi } from '../codex'
import { claudeProviderApi } from '../claude'
import { openaiProviderApi } from '../openai'
import type { ProviderData, ProviderAccount, ProviderType } from '../types'


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
  const [gemini, codex, claude, openai] = await Promise.allSettled([
    fetchGeminiData(),
    fetchCodexData(),
    fetchClaudeData(),
    fetchOpenAIData()
  ])

  return {
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
    case 'gemini': return fetchGeminiData()
    case 'codex': return fetchCodexData()
    case 'claude': return fetchClaudeData()
    case 'openai': return fetchOpenAIData()
    default: return { provider, accounts: [], stats: emptyStats, error: 'Provider not implemented' }
  }
}
