/**
 * 日志级别过滤器组件
 */

import { LOG_LEVELS } from '../../constants'
import type { LogLevel } from '../../constants'

interface LogLevelFilterProps {
  selectedLevel: LogLevel
  onLevelChange: (level: LogLevel) => void
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; activeBg: string }> = {
  all: { bg: '#f3f4f6', text: '#374151', activeBg: '#374151' },
  trace: { bg: '#f8fafc', text: '#475569', activeBg: '#475569' },
  debug: { bg: '#eff6ff', text: '#2563eb', activeBg: '#2563eb' },
  info: { bg: '#f0fdf4', text: '#16a34a', activeBg: '#16a34a' },
  warn: { bg: '#fffbeb', text: '#d97706', activeBg: '#d97706' },
  error: { bg: '#fef2f2', text: '#dc2626', activeBg: '#dc2626' },
  fatal: { bg: '#fff1f2', text: '#e11d48', activeBg: '#e11d48' }
}

export function LogLevelFilter({ selectedLevel, onLevelChange }: LogLevelFilterProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {LOG_LEVELS.map(({ key, label }) => {
        const isActive = selectedLevel === key
        const colors = LEVEL_COLORS[key] || LEVEL_COLORS.all
        
        return (
          <button
            key={key}
            type="button"
            onClick={() => onLevelChange(key)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isActive ? colors.activeBg : colors.bg,
              color: isActive ? '#ffffff' : colors.text
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
