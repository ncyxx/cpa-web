/**
 * Amp CLI Integration (ampcode) 相关 API
 */

import { apiClient } from '../client'

export interface AmpcodeModelMapping {
  from: string
  to: string
}

export interface AmpcodeConfig {
  upstreamUrl?: string
  upstreamApiKey?: string
  modelMappings?: AmpcodeModelMapping[]
  forceModelMappings?: boolean
}

const normalizeBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on'].includes(trimmed)) return true
    if (['false', '0', 'no', 'n', 'off'].includes(trimmed)) return false
  }
  return Boolean(value)
}

function normalizeModelMappings(input: any): AmpcodeModelMapping[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const mappings: AmpcodeModelMapping[] = []

  input.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return
    const from = String(entry.from ?? entry['from'] ?? '').trim()
    const to = String(entry.to ?? entry['to'] ?? '').trim()
    if (!from || !to) return
    const key = from.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    mappings.push({ from, to })
  })

  return mappings
}

function normalizeAmpcodeConfig(payload: any): AmpcodeConfig {
  const source = payload?.ampcode ?? payload
  if (!source || typeof source !== 'object') return {}

  const config: AmpcodeConfig = {}
  const upstreamUrl = source['upstream-url'] ?? source.upstreamUrl ?? source['upstream_url']
  if (upstreamUrl) config.upstreamUrl = String(upstreamUrl)
  const upstreamApiKey = source['upstream-api-key'] ?? source.upstreamApiKey ?? source['upstream_api_key']
  if (upstreamApiKey) config.upstreamApiKey = String(upstreamApiKey)

  const forceModelMappings = normalizeBoolean(
    source['force-model-mappings'] ?? source.forceModelMappings ?? source['force_model_mappings']
  )
  if (forceModelMappings !== undefined) {
    config.forceModelMappings = forceModelMappings
  }

  const modelMappings = normalizeModelMappings(
    source['model-mappings'] ?? source.modelMappings ?? source['model_mappings']
  )
  if (modelMappings.length) {
    config.modelMappings = modelMappings
  }

  return config
}

export const ampcodeApi = {
  async getAmpcode(): Promise<AmpcodeConfig> {
    const data = await apiClient.get('/ampcode')
    return normalizeAmpcodeConfig(data)
  },

  updateUpstreamUrl: (url: string) => 
    apiClient.put('/ampcode/upstream-url', { value: url }),
  
  clearUpstreamUrl: () => 
    apiClient.delete('/ampcode/upstream-url'),

  updateUpstreamApiKey: (apiKey: string) => 
    apiClient.put('/ampcode/upstream-api-key', { value: apiKey }),
  
  clearUpstreamApiKey: () => 
    apiClient.delete('/ampcode/upstream-api-key'),

  async getModelMappings(): Promise<AmpcodeModelMapping[]> {
    const data = await apiClient.get('/ampcode/model-mappings')
    const list = data?.['model-mappings'] ?? data?.modelMappings ?? data?.items ?? data
    return normalizeModelMappings(list)
  },

  saveModelMappings: (mappings: AmpcodeModelMapping[]) =>
    apiClient.put('/ampcode/model-mappings', { value: mappings }),

  patchModelMappings: (mappings: AmpcodeModelMapping[]) =>
    apiClient.patch('/ampcode/model-mappings', { value: mappings }),

  clearModelMappings: () => 
    apiClient.delete('/ampcode/model-mappings'),

  deleteModelMappings: (fromList: string[]) =>
    apiClient.delete('/ampcode/model-mappings', { data: { value: fromList } }),

  updateForceModelMappings: (enabled: boolean) => 
    apiClient.put('/ampcode/force-model-mappings', { value: enabled })
}
