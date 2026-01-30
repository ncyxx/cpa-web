/**
 * Providers API 模块入口
 * Barrel Pattern - 统一导出
 */

// Types
export type {
  ModelAlias,
  ApiKeyEntry,
  ProviderKeyConfig,
  GeminiKeyConfig,
  OpenAIProviderConfig,
  ProviderType,
  ProviderStatus,
  ProviderStats,
  ProviderAccount,
  ProviderData
} from './types'

// Serializers
export {
  serializeHeaders,
  serializeModelAliases,
  serializeApiKeyEntry,
  serializeProviderKey,
  serializeGeminiKey,
  serializeOpenAIProvider
} from './serializers'

// Normalizers
export {
  normalizeApiKeyEntry,
  normalizeProviderKeyConfig,
  normalizeGeminiKeyConfig,
  normalizeOpenAIProvider
} from './normalizers'

// Legacy API
export { providersApi } from './api'

// Provider APIs
export { kiroProviderApi, type KiroToken, type KiroTokensResponse, type KiroQuotaResponse, type KiroHealthCheckResult } from './kiro'
export { geminiProviderApi } from './gemini'
export { codexProviderApi } from './codex'
export { claudeProviderApi } from './claude'
export { openaiProviderApi } from './openai'

// Aggregator
export { fetchAllProviderData, fetchProviderData } from './aggregator'
