/**
 * Provider Serializers Module
 * Transform frontend data to API format
 */

import type { ModelAlias, ApiKeyEntry, ProviderKeyConfig, GeminiKeyConfig, OpenAIProviderConfig } from '../types'

export const serializeHeaders = (headers?: Record<string, string>) => 
  (headers && Object.keys(headers).length ? headers : undefined)

export const serializeModelAliases = (models?: ModelAlias[]) =>
  Array.isArray(models)
    ? models.map((model) => {
        if (!model?.name) return null
        const payload: Record<string, any> = { name: model.name }
        if (model.alias && model.alias !== model.name) payload.alias = model.alias
        if (model.priority !== undefined) payload.priority = model.priority
        if (model.testModel) payload['test-model'] = model.testModel
        return payload
      }).filter(Boolean)
    : undefined

export const serializeApiKeyEntry = (entry: ApiKeyEntry) => {
  const payload: Record<string, any> = { 'api-key': entry.apiKey }
  if (entry.proxyUrl) payload['proxy-url'] = entry.proxyUrl
  const headers = serializeHeaders(entry.headers)
  if (headers) payload.headers = headers
  return payload
}

export const serializeProviderKey = (config: ProviderKeyConfig) => {
  const payload: Record<string, any> = { 'api-key': config.apiKey }
  if (config.prefix?.trim()) payload.prefix = config.prefix.trim()
  if (config.baseUrl) payload['base-url'] = config.baseUrl
  if (config.proxyUrl) payload['proxy-url'] = config.proxyUrl
  const headers = serializeHeaders(config.headers)
  if (headers) payload.headers = headers
  const models = serializeModelAliases(config.models)
  if (models && models.length) payload.models = models
  if (config.excludedModels && config.excludedModels.length) {
    payload['excluded-models'] = config.excludedModels
  }
  return payload
}

export const serializeGeminiKey = (config: GeminiKeyConfig) => {
  const payload: Record<string, any> = { 'api-key': config.apiKey }
  if (config.prefix?.trim()) payload.prefix = config.prefix.trim()
  if (config.baseUrl) payload['base-url'] = config.baseUrl
  const headers = serializeHeaders(config.headers)
  if (headers) payload.headers = headers
  if (config.excludedModels && config.excludedModels.length) {
    payload['excluded-models'] = config.excludedModels
  }
  return payload
}

export const serializeOpenAIProvider = (provider: OpenAIProviderConfig) => {
  const payload: Record<string, any> = {
    name: provider.name,
    'base-url': provider.baseUrl,
    'api-key-entries': Array.isArray(provider.apiKeyEntries)
      ? provider.apiKeyEntries.map((entry) => serializeApiKeyEntry(entry))
      : []
  }
  if (provider.prefix?.trim()) payload.prefix = provider.prefix.trim()
  const headers = serializeHeaders(provider.headers)
  if (headers) payload.headers = headers
  const models = serializeModelAliases(provider.models)
  if (models && models.length) payload.models = models
  if (provider.priority !== undefined) payload.priority = provider.priority
  if (provider.testModel) payload['test-model'] = provider.testModel
  return payload
}
