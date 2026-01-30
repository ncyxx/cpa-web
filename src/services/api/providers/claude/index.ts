/**
 * Claude Provider API Module
 * Handles Anthropic Claude authentication and configuration
 */

import { apiClient } from '../../client'
import type { ProviderKeyConfig } from '../types'
import { serializeProviderKey } from '../serializers'
import { normalizeProviderKeyConfig } from '../normalizers'

export const claudeProviderApi = {
  async getConfigs(): Promise<ProviderKeyConfig[]> {
    const data = await apiClient.get('/claude-api-key')
    const list = (data && (data['claude-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeProviderKeyConfig(item)).filter(Boolean) as ProviderKeyConfig[]
  },

  saveConfigs: (configs: ProviderKeyConfig[]) =>
    apiClient.put('/claude-api-key', configs.map((item) => serializeProviderKey(item))),

  updateConfig: (index: number, value: ProviderKeyConfig) =>
    apiClient.patch('/claude-api-key', { index, value: serializeProviderKey(value) }),

  deleteConfig: (apiKey: string) =>
    apiClient.delete(`/claude-api-key?api-key=${encodeURIComponent(apiKey)}`)
}
