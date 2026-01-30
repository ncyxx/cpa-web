/**
 * API 密钥页面常量
 */

// 生成随机 API Key
export function generateRandomApiKey(prefix = 'sk-'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 批量生成
export function generateMultipleApiKeys(count: number, prefix = 'sk-'): string[] {
  return Array.from({ length: count }, () => generateRandomApiKey(prefix))
}

// 遮罩显示 API Key
export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return key
  return `${key.slice(0, 7)}${'*'.repeat(32)}${key.slice(-4)}`
}
