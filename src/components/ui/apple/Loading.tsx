import * as React from 'react'
import { cn } from '@/lib/utils'
import './Loading.scss'

export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'bar' | 'skeleton'
export type LoadingColor = 'primary' | 'white' | 'black' | 'current'

export interface LoadingProps {
  loading?: boolean
  type?: LoadingType
  size?: number
  color?: LoadingColor
  text?: string
  progress?: number
  showProgress?: boolean
  overlay?: boolean
  blur?: boolean
  className?: string
  children?: React.ReactNode
}

export function Loading({
  loading = true,
  type = 'spinner',
  size = 48,
  color = 'primary',
  text,
  progress = 0,
  showProgress = true,
  overlay = false,
  blur = false,
  className,
  children,
}: LoadingProps) {
  if (!loading) return null

  return (
    <div
      className={cn(
        'apple-loading',
        `apple-loading-${color}`,
        overlay && 'apple-loading-overlay',
        blur && 'apple-loading-blur',
        className
      )}
    >
      {type === 'spinner' && (
        <div className="apple-loading-spinner">
          <svg width={size} height={size} viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="90"
              strokeDashoffset="15"
              strokeLinecap="round"
              className="apple-loading-spinner-circle"
            />
          </svg>
        </div>
      )}

      {type === 'dots' && (
        <div className="apple-loading-dots">
          {[0, 1, 2].map((i) => (
            <span key={i} className="apple-loading-dot" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      {type === 'pulse' && (
        <div className="apple-loading-pulse">
          <span className="apple-loading-pulse-ring" />
          <span className="apple-loading-pulse-ring" style={{ animationDelay: '0.5s' }} />
          <span className="apple-loading-pulse-ring" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {type === 'bar' && (
        <div className="apple-loading-bar">
          <div className="apple-loading-bar-track">
            <div className="apple-loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {showProgress && <span className="apple-loading-bar-label">{progress}%</span>}
        </div>
      )}

      {type === 'skeleton' && (
        <div className="apple-loading-skeleton">
          {children || (
            <div className="apple-skeleton-card">
              <div className="apple-skeleton-header">
                <div className="apple-skeleton-avatar" />
                <div className="apple-skeleton-lines">
                  <div className="apple-skeleton-line" style={{ width: '60%' }} />
                  <div className="apple-skeleton-line" style={{ width: '40%' }} />
                </div>
              </div>
              <div className="apple-skeleton-content">
                <div className="apple-skeleton-line" />
                <div className="apple-skeleton-line" />
                <div className="apple-skeleton-line" style={{ width: '80%' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {text && type !== 'skeleton' && <span className="apple-loading-text">{text}</span>}
    </div>
  )
}

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg className={cn('animate-spin text-current', className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
