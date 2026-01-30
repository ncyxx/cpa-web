/**
 * 认证文件页面工具函数
 */

import type { AuthFile } from '@/services/api/authFiles'
import { TYPE_COLORS, TYPE_LABELS } from '../constants'

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 格式化修改时间
 */
export function formatModified(item: AuthFile): string {
  const raw = (item as any).modtime ?? (item as any).modified ?? item.modTime
  if (!raw) return '-'
  const asNumber = Number(raw)
  const date = Number.isFinite(asNumber) && !Number.isNaN(asNumber)
    ? new Date(asNumber < 1e12 ? asNumber * 1000 : asNumber)
    : new Date(String(raw))
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

/**
 * 获取类型颜色
 */
export function getTypeColor(type: string) {
  return TYPE_COLORS[type?.toLowerCase()] || TYPE_COLORS.unknown
}

/**
 * 获取类型标签
 */
export function getTypeLabel(type: string): string {
  const lower = type?.toLowerCase()
  return TYPE_LABELS[lower] || type?.charAt(0).toUpperCase() + type?.slice(1) || '未知'
}
