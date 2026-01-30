/**
 * Legacy Providers API
 * Backward compatibility layer
 */

import { apiClient } from '../../client'
import type { ProviderKeyConfig, GeminiKeyConfig, OpenAIProviderConfig } from '../types'
import { serializeProviderKey, serializeGeminiKey, serializeOpenAIProvider } from '../serializers'
import { normalizeProviderKeyConfig, normalizeGeminiKeyConfig, normalizeOpenAIProvider } from '../normalizers'

export const providersApi = {
  // Gemini
  async getGeminiKeys(): Promise<GeminiKeyConfig[]> {
    const data = await apiClient.get('/gemini-api-key')
    const list = (data && (data['gemini-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeGeminiKeyConfig(item)).filter(Boolean) as GeminiKeyConfig[]
  },
  saveGeminiKeys: (configs: GeminiKeyConfig[]) =>
    apiClient.put('/gemini-api-key', configs.map((item) => serializeGeminiKey(item))),
  updateGeminiKey: (index: number, value: GeminiKeyConfig) =>
    apiClient.patch('/gemini-api-key', { index, value: serializeGeminiKey(value) }),
  deleteGeminiKey: (apiKey: string) =>
    apiClient.delete(`/gemini-api-key?api-key=${encodeURIComponent(apiKey)}`),

  // Codex
  async getCodexConfigs(): Promise<ProviderKeyConfig[]> {
    const data = await apiClient.get('/codex-api-key')
    const list = (data && (data['codex-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeProviderKeyConfig(item)).filter(Boolean) as ProviderKeyConfig[]
  },
  saveCodexConfigs: (configs: ProviderKeyConfig[]) =>
    apiClient.put('/codex-api-key', configs.map((item) => serializeProviderKey(item))),
  updateCodexConfig: (index: number, value: ProviderKeyConfig) =>
    apiClient.patch('/codex-api-key', { index, value: serializeProviderKey(value) }),
  deleteCodexConfig: (apiKey: string) =>
    apiClient.delete(`/codex-api-key?api-key=${encodeURIComponent(apiKey)}`),


  // Claude
  async getClaudeConfigs(): Promise<ProviderKeyConfig[]> {
    const data = await apiClient.get('/claude-api-key')
    const list = (data && (data['claude-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeProviderKeyConfig(item)).filter(Boolean) as ProviderKeyConfig[]
  },
  saveClaudeConfigs: (configs: ProviderKeyConfig[]) =>
    apiClient.put('/claude-api-key', configs.map((item) => serializeProviderKey(item))),
  updateClaudeConfig: (index: number, value: ProviderKeyConfig) =>
    apiClient.patch('/claude-api-key', { index, value: serializeProviderKey(value) }),
  deleteClaudeConfig: (apiKey: string) =>
    apiClient.delete(`/claude-api-key?api-key=${encodeURIComponent(apiKey)}`),

  // OpenAI Compatibility
  async getOpenAIProviders(): Promise<OpenAIProviderConfig[]> {
    const data = await apiClient.get('/openai-compatibility')
    const list = (data && (data['openai-compatibility'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeOpenAIProvider(item)).filter(Boolean) as OpenAIProviderConfig[]
  },
  saveOpenAIProviders: (providers: OpenAIProviderConfig[]) =>
    apiClient.put('/openai-compatibility', providers.map((item) => serializeOpenAIProvider(item))),
  updateOpenAIProvider: (index: number, value: OpenAIProviderConfig) =>
    apiClient.patch('/openai-compatibility', { index, value: serializeOpenAIProvider(value) }),
  deleteOpenAIProvider: (name: string) =>
    apiClient.delete(`/openai-compatibility?name=${encodeURIComponent(name)}`)
}
