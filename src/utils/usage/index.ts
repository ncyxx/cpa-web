/**
 * 使用统计工具函数
 * 计算 RPM、TPM、Cost 等指标
 */

export interface UsageDetail {
  timestamp: string
  source: string
  auth_index: number
  tokens: {
    input_tokens: number
    output_tokens: number
    reasoning_tokens: number
    cached_tokens: number
    cache_tokens?: number
    total_tokens: number
  }
  failed: boolean
  __modelName?: string
}

export interface RateStats {
  rpm: number
  tpm: number
  windowMinutes: number
  requestCount: number
  tokenCount: number
}

export interface ModelPrice {
  prompt: number
  completion: number
  cache: number
}

const TOKENS_PER_PRICE_UNIT = 1_000_000
const MODEL_PRICE_STORAGE_KEY = 'cli-proxy-model-prices-v2'

/**
 * 从使用数据中收集所有请求明细
 */
export function collectUsageDetails(usageData: any): UsageDetail[] {
  if (!usageData) return []
  const apis = usageData.apis || {}
  const details: UsageDetail[] = []
  
  Object.values(apis as Record<string, any>).forEach((apiEntry) => {
    const models = apiEntry?.models || {}
    Object.entries(models as Record<string, any>).forEach(([modelName, modelEntry]) => {
      const modelDetails = Array.isArray(modelEntry.details) ? modelEntry.details : []
      modelDetails.forEach((detail: any) => {
        if (detail && detail.timestamp) {
          details.push({ ...detail, __modelName: modelName })
        }
      })
    })
  })
  return details
}

/**
 * 从单条明细提取总 tokens
 */
export function extractTotalTokens(detail: any): number {
  const tokens = detail?.tokens || {}
  if (typeof tokens.total_tokens === 'number') return tokens.total_tokens
  
  const inputTokens = typeof tokens.input_tokens === 'number' ? tokens.input_tokens : 0
  const outputTokens = typeof tokens.output_tokens === 'number' ? tokens.output_tokens : 0
  const reasoningTokens = typeof tokens.reasoning_tokens === 'number' ? tokens.reasoning_tokens : 0
  const cachedTokens = Math.max(
    typeof tokens.cached_tokens === 'number' ? Math.max(tokens.cached_tokens, 0) : 0,
    typeof tokens.cache_tokens === 'number' ? Math.max(tokens.cache_tokens, 0) : 0
  )
  return inputTokens + outputTokens + reasoningTokens + cachedTokens
}

/**
 * 计算最近 N 分钟的 RPM/TPM
 */
export function calculateRecentPerMinuteRates(usageData: any, windowMinutes: number = 30): RateStats {
  const details = collectUsageDetails(usageData)
  const effectiveWindow = Number.isFinite(windowMinutes) && windowMinutes > 0 ? windowMinutes : 30

  if (!details.length) {
    return { rpm: 0, tpm: 0, windowMinutes: effectiveWindow, requestCount: 0, tokenCount: 0 }
  }

  const now = Date.now()
  const windowStart = now - effectiveWindow * 60 * 1000
  let requestCount = 0
  let tokenCount = 0

  details.forEach(detail => {
    const timestamp = Date.parse(detail.timestamp)
    if (Number.isNaN(timestamp) || timestamp < windowStart) return
    requestCount += 1
    tokenCount += extractTotalTokens(detail)
  })

  const denominator = effectiveWindow > 0 ? effectiveWindow : 1
  return {
    rpm: requestCount / denominator,
    tpm: tokenCount / denominator,
    windowMinutes: effectiveWindow,
    requestCount,
    tokenCount
  }
}

/**
 * 计算单条明细的成本
 */
export function calculateCost(detail: any, modelPrices: Record<string, ModelPrice>): number {
  const modelName = detail.__modelName || ''
  const price = modelPrices[modelName]
  if (!price) return 0

  const tokens = detail?.tokens || {}
  const rawInputTokens = Number(tokens.input_tokens)
  const rawCompletionTokens = Number(tokens.output_tokens)
  const rawCachedTokensPrimary = Number(tokens.cached_tokens)
  const rawCachedTokensAlternate = Number(tokens.cache_tokens)

  const inputTokens = Number.isFinite(rawInputTokens) ? Math.max(rawInputTokens, 0) : 0
  const completionTokens = Number.isFinite(rawCompletionTokens) ? Math.max(rawCompletionTokens, 0) : 0
  const cachedTokens = Math.max(
    Number.isFinite(rawCachedTokensPrimary) ? Math.max(rawCachedTokensPrimary, 0) : 0,
    Number.isFinite(rawCachedTokensAlternate) ? Math.max(rawCachedTokensAlternate, 0) : 0
  )
  const promptTokens = Math.max(inputTokens - cachedTokens, 0)

  const promptCost = (promptTokens / TOKENS_PER_PRICE_UNIT) * (Number(price.prompt) || 0)
  const cachedCost = (cachedTokens / TOKENS_PER_PRICE_UNIT) * (Number(price.cache) || 0)
  const completionCost = (completionTokens / TOKENS_PER_PRICE_UNIT) * (Number(price.completion) || 0)
  const total = promptCost + cachedCost + completionCost
  return Number.isFinite(total) && total > 0 ? total : 0
}

/**
 * 计算总成本
 */
export function calculateTotalCost(usageData: any, modelPrices: Record<string, ModelPrice>): number {
  const details = collectUsageDetails(usageData)
  if (!details.length || !Object.keys(modelPrices).length) return 0
  return details.reduce((sum, detail) => sum + calculateCost(detail, modelPrices), 0)
}

/**
 * 从 localStorage 加载模型价格
 */
export function loadModelPrices(): Record<string, ModelPrice> {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(MODEL_PRICE_STORAGE_KEY)
    if (!raw) return {}
    
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    
    const normalized: Record<string, ModelPrice> = {}
    Object.entries(parsed).forEach(([model, price]: [string, any]) => {
      if (!model) return
      const promptRaw = Number(price?.prompt)
      const completionRaw = Number(price?.completion)
      const cacheRaw = Number(price?.cache)

      if (!Number.isFinite(promptRaw) && !Number.isFinite(completionRaw) && !Number.isFinite(cacheRaw)) return

      const prompt = Number.isFinite(promptRaw) && promptRaw >= 0 ? promptRaw : 0
      const completion = Number.isFinite(completionRaw) && completionRaw >= 0 ? completionRaw : 0
      const cache = Number.isFinite(cacheRaw) && cacheRaw >= 0 ? cacheRaw : prompt

      normalized[model] = { prompt, completion, cache }
    })
    return normalized
  } catch {
    return {}
  }
}

/**
 * 保存模型价格到 localStorage
 */
export function saveModelPrices(prices: Record<string, ModelPrice>): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(MODEL_PRICE_STORAGE_KEY, JSON.stringify(prices))
  } catch {
    console.warn('保存模型价格失败')
  }
}

/**
 * 格式化 RPM/TPM 数值
 */
export function formatPerMinuteValue(value: number): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0.00'
  const abs = Math.abs(num)
  if (abs >= 1000) return Math.round(num).toLocaleString()
  if (abs >= 100) return num.toFixed(0)
  if (abs >= 10) return num.toFixed(1)
  return num.toFixed(2)
}

/**
 * 格式化美元
 */
export function formatUsd(value: number): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '$0.00'
  return `$${num.toFixed(2)}`
}
