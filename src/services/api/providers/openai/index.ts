/**
 * OpenAI Provider API Module
 * Handles OpenAI compatibility layer configuration
 */

import { apiClient } from '../../client'
import type { OpenAIProviderConfig } from '../types'
import { serializeOpenAIProvider } from '../serializers'
import { normalizeOpenAIProvider } from '../normalizers'

export const openaiProviderApi = {
  async getProviders(): Promise<OpenAIProviderConfig[]> {
    const data = await apiClient.get('/openai-compatibility')
    const list = (data && (data['openai-compatibility'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeOpenAIProvider(item)).filter(Boolean) as OpenAIProviderConfig[]
  },

  saveProviders: (providers: OpenAIProviderConfig[]) =>
    apiClient.put('/openai-compatibility', providers.map((item) => serializeOpenAIProvider(item))),

  updateProvider: (index: number, value: OpenAIProviderConfig) =>
    apiClient.patch('/openai-compatibility', { index, value: serializeOpenAIProvider(value) }),

  deleteProvider: (name: string) =>
    apiClient.delete(`/openai-compatibility?name=${encodeURIComponent(name)}`)
}
