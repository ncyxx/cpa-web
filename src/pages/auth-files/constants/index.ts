/**
 * 认证文件页面常量
 */

// 类型颜色配置
export const TYPE_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  kiro: { bg: 'bg-violet-50', text: 'text-violet-600' },
  qwen: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  gemini: { bg: 'bg-blue-50', text: 'text-blue-600' },
  'gemini-cli': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  aistudio: { bg: 'bg-slate-100', text: 'text-slate-600' },
  claude: { bg: 'bg-pink-50', text: 'text-pink-600' },
  codex: { bg: 'bg-orange-50', text: 'text-orange-600' },
  antigravity: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  iflow: { bg: 'bg-purple-50', text: 'text-purple-600' },
  vertex: { bg: 'bg-teal-50', text: 'text-teal-600' },
  empty: { bg: 'bg-gray-100', text: 'text-gray-500' },
  unknown: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border border-dashed border-gray-300' }
}

// 类型标签
export const TYPE_LABELS: Record<string, string> = {
  all: '全部',
  kiro: 'Kiro',
  qwen: 'Qwen',
  gemini: 'Gemini',
  'gemini-cli': 'Gemini CLI',
  aistudio: 'AI Studio',
  claude: 'Claude',
  codex: 'Codex',
  antigravity: 'Antigravity',
  iflow: 'iFlow',
  vertex: 'Vertex',
  empty: '空',
  unknown: '未知'
}

// 分页大小
export const PAGE_SIZE = 12
