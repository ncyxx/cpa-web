/**
 * Codex Provider API Module
 * Handles OpenAI Codex authentication and configuration
 */

import { apiClient } from '../../client'
import type { ProviderKeyConfig } from '../types'
import { serializeProviderKey } from '../serializers'
import { normalizeProviderKeyConfig } from '../normalizers'

export const codexProviderApi = {
  async getConfigs(): Promise<ProviderKeyConfig[]> {
    const data = await apiClient.get('/codex-api-key')
    const list = (data && (data['codex-api-key'] ?? data.items ?? data)) as any
    if (!Array.isArray(list)) return []
    return list.map((item) => normalizeProviderKeyConfig(item)).filter(Boolean) as ProviderKeyConfig[]
  },

  saveConfigs: (configs: ProviderKeyConfig[]) =>
    apiClient.put('/codex-api-key', configs.map((item) => serializeProviderKey(item))),

  updateConfig: (index: number, value: ProviderKeyConfig) =>
    apiClient.patch('/codex-api-key', { index, value: serializeProviderKey(value) }),

  deleteConfig: (apiKey: string) =>
    apiClient.delete(`/codex-api-key?api-key=${encodeURIComponent(apiKey)}`)
}
