/**
 * Gemini Provider API Module
 * Handles Google AI authentication and configuration
 */

import { apiClient } from '../../client'
import type { GeminiKeyConfig } from '../types'
import { serializeGeminiKey } from '../serializers'
import { normalizeGeminiKeyConfig } from '../normalizers'

export const geminiProviderApi = {
  async getKeys(): Promise<GeminiKeyConfig[]> {
    const data = await apiClient.get('/gemini-api-key')
    const list = (data && (data['gemini-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeGeminiKeyConfig(item)).filter(Boolean) as GeminiKeyConfig[]
  },

  saveKeys: (configs: GeminiKeyConfig[]) =>
    apiClient.put('/gemini-api-key', configs.map((item) => serializeGeminiKey(item))),

  updateKey: (index: number, value: GeminiKeyConfig) =>
    apiClient.patch('/gemini-api-key', { index, value: serializeGeminiKey(value) }),

  deleteKey: (apiKey: string) =>
    apiClient.delete(`/gemini-api-key?api-key=${encodeURIComponent(apiKey)}`)
}
