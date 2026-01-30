/**
 * Provider Normalizers Module
 * Transform API data to frontend format
 */

import type { ModelAlias, ApiKeyEntry, ProviderKeyConfig, GeminiKeyConfig, OpenAIProviderConfig } from '../types'

const normalizeHeaders = (headers: any): Record<string, string> | undefined => {
  if (!headers || typeof headers !== 'object') return undefined
  const normalized: Record<string, string> = {}
  Object.entries(headers).forEach(([key, value]) => {
    const k = String(key || '').trim()
    if (!k) return
    normalized[k] = String(value ?? '')
  })
  return Object.keys(normalized).length ? normalized : undefined
}

const normalizePrefix = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined
  const trimmed = String(value).trim()
  return trimmed ? trimmed : undefined
}

const normalizeExcludedModels = (input: any): string[] => {
  const rawList = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[\n,]/) : []
  const seen = new Set<string>()
  const normalized: string[] = []

  rawList.forEach((item) => {
    const trimmed = String(item ?? '').trim()
    if (!trimmed) return
    const key = trimmed.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    normalized.push(trimmed)
  })

  return normalized
}

const normalizeModelAliases = (models: any): ModelAlias[] => {
  if (!Array.isArray(models)) return []
  return models
    .map((item) => {
      if (!item) return null
      const name = item.name || item.id || item.model
      if (!name) return null
      const alias = item.alias || item.display_name || item.displayName
      const priority = item.priority ?? item['priority']
      const testModel = item['test-model'] ?? item.testModel
      const entry: ModelAlias = { name: String(name) }
      if (alias && alias !== name) {
        entry.alias = String(alias)
      }
      if (priority !== undefined) {
        entry.priority = Number(priority)
      }
      if (testModel) {
        entry.testModel = String(testModel)
      }
      return entry
    })
    .filter(Boolean) as ModelAlias[]
}

export const normalizeApiKeyEntry = (entry: any): ApiKeyEntry | null => {
  if (!entry) return null
  const apiKey = entry['api-key'] ?? entry.apiKey ?? entry.key ?? (typeof entry === 'string' ? entry : '')
  const trimmed = String(apiKey || '').trim()
  if (!trimmed) return null

  const proxyUrl = entry['proxy-url'] ?? entry.proxyUrl
  const headers = normalizeHeaders(entry.headers)

  return {
    apiKey: trimmed,
    proxyUrl: proxyUrl ? String(proxyUrl) : undefined,
    headers
  }
}

export const normalizeProviderKeyConfig = (item: any): ProviderKeyConfig | null => {
  if (!item) return null
  const apiKey = item['api-key'] ?? item.apiKey ?? (typeof item === 'string' ? item : '')
  const trimmed = String(apiKey || '').trim()
  if (!trimmed) return null

  const config: ProviderKeyConfig = { apiKey: trimmed }
  const prefix = normalizePrefix(item.prefix ?? item['prefix'])
  if (prefix) config.prefix = prefix
  const baseUrl = item['base-url'] ?? item.baseUrl
  const proxyUrl = item['proxy-url'] ?? item.proxyUrl
  if (baseUrl) config.baseUrl = String(baseUrl)
  if (proxyUrl) config.proxyUrl = String(proxyUrl)
  const headers = normalizeHeaders(item.headers)
  if (headers) config.headers = headers
  const models = normalizeModelAliases(item.models)
  if (models.length) config.models = models
  const excludedModels = normalizeExcludedModels(
    item['excluded-models'] ?? item.excludedModels ?? item['excluded_models'] ?? item.excluded_models
  )
  if (excludedModels.length) config.excludedModels = excludedModels
  return config
}

export const normalizeGeminiKeyConfig = (item: any): GeminiKeyConfig | null => {
  if (!item) return null
  let apiKey = item['api-key'] ?? item.apiKey
  if (!apiKey && typeof item === 'string') {
    apiKey = item
  }
  const trimmed = String(apiKey || '').trim()
  if (!trimmed) return null

  const config: GeminiKeyConfig = { apiKey: trimmed }
  const prefix = normalizePrefix(item.prefix ?? item['prefix'])
  if (prefix) config.prefix = prefix
  const baseUrl = item['base-url'] ?? item.baseUrl ?? item['base_url']
  if (baseUrl) config.baseUrl = String(baseUrl)
  const headers = normalizeHeaders(item.headers)
  if (headers) config.headers = headers
  const excludedModels = normalizeExcludedModels(item['excluded-models'] ?? item.excludedModels)
  if (excludedModels.length) config.excludedModels = excludedModels
  return config
}

export const normalizeOpenAIProvider = (provider: any): OpenAIProviderConfig | null => {
  if (!provider || typeof provider !== 'object') return null
  const name = provider.name || provider.id
  const baseUrl = provider['base-url'] ?? provider.baseUrl
  if (!name || !baseUrl) return null

  let apiKeyEntries: ApiKeyEntry[] = []
  if (Array.isArray(provider['api-key-entries'])) {
    apiKeyEntries = provider['api-key-entries']
      .map((entry: any) => normalizeApiKeyEntry(entry))
      .filter(Boolean) as ApiKeyEntry[]
  } else if (Array.isArray(provider['api-keys'])) {
    apiKeyEntries = provider['api-keys']
      .map((key: any) => normalizeApiKeyEntry({ 'api-key': key }))
      .filter(Boolean) as ApiKeyEntry[]
  }

  const headers = normalizeHeaders(provider.headers)
  const models = normalizeModelAliases(provider.models)
  const priority = provider.priority ?? provider['priority']
  const testModel = provider['test-model'] ?? provider.testModel

  const result: OpenAIProviderConfig = {
    name: String(name),
    baseUrl: String(baseUrl),
    apiKeyEntries
  }

  const prefix = normalizePrefix(provider.prefix ?? provider['prefix'])
  if (prefix) result.prefix = prefix
  if (headers) result.headers = headers
  if (models.length) result.models = models
  if (priority !== undefined) result.priority = Number(priority)
  if (testModel) result.testModel = String(testModel)
  return result
}
