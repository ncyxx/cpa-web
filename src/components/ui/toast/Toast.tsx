import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  title?: string
  description?: string
  type?: ToastType
  duration?: number
}

interface ToastMessage extends Required<ToastOptions> {
  id: number
}

const DEFAULT_DURATION = 3200
const DEFAULT_TITLE: Record<ToastType, string> = {
  success: '操作成功',
  error: '出现问题',
  info: '提示',
  warning: '注意'
}

const typeStyles: Record<ToastType, { border: string; background: string; text: string; accent: string }> = {
  success: {
    border: 'border-emerald-200/80',
    background: 'bg-emerald-50/95 dark:bg-emerald-950/95',
    text: 'text-emerald-900 dark:text-emerald-100',
    accent: 'bg-emerald-500'
  },
  error: {
    border: 'border-rose-200/80',
    background: 'bg-rose-50/95 dark:bg-rose-950/95',
    text: 'text-rose-900 dark:text-rose-100',
    accent: 'bg-rose-500'
  },
  warning: {
    border: 'border-amber-200/80',
    background: 'bg-amber-50/95 dark:bg-amber-950/95',
    text: 'text-amber-900 dark:text-amber-100',
    accent: 'bg-amber-500'
  },
  info: {
    border: 'border-blue-200/80',
    background: 'bg-blue-50/95 dark:bg-blue-950/95',
    text: 'text-blue-900 dark:text-blue-100',
    accent: 'bg-blue-500'
  }
}

interface ToastContextValue {
  toast: (options: ToastOptions | string) => number
  success: (options: ToastOptions | string) => number
  error: (options: ToastOptions | string) => number
  warning: (options: ToastOptions | string) => number
  info: (options: ToastOptions | string) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((options: ToastOptions | string, type: ToastType = 'info') => {
    const normalized: ToastOptions = typeof options === 'string'
      ? { description: options, type }
      : { ...options, type: options.type || type }

    const id = ++idCounter
    const toast: ToastMessage = {
      id,
      title: normalized.title || DEFAULT_TITLE[normalized.type || 'info'],
      description: normalized.description || '',
      type: normalized.type || 'info',
      duration: normalized.duration ?? DEFAULT_DURATION
    }

    setToasts(prev => [...prev, toast])

    if (toast.duration !== 0) {
      window.setTimeout(() => removeToast(id), toast.duration)
    }

    return id
  }, [removeToast])

  const value: ToastContextValue = {
    toast: (options) => addToast(options, 'info'),
    success: (options) => addToast(options, 'success'),
    error: (options) => addToast(options, 'error'),
    warning: (options) => addToast(options, 'warning'),
    info: (options) => addToast(options, 'info'),
    dismiss: removeToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[1000] flex flex-col items-end gap-3 px-4 py-6 sm:top-4 sm:right-4 sm:left-auto sm:w-[420px] sm:px-0">
          <div className="flex w-full flex-col gap-3">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={cn(
                  'pointer-events-auto relative w-full overflow-hidden rounded-apple-md border shadow-apple-lg backdrop-blur animate-in slide-in-from-top-2 fade-in duration-200',
                  typeStyles[toast.type].border,
                  typeStyles[toast.type].background,
                  typeStyles[toast.type].text
                )}
              >
                <div className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={cn(
                      'mt-1 inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full',
                      typeStyles[toast.type].accent
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description && (
                      <p className="text-sm opacity-80">{toast.description}</p>
                    )}
                  </div>
                  <button
                    className="rounded-full p-1 transition hover:bg-white/60 dark:hover:bg-black/20 cursor-pointer"
                    type="button"
                    aria-label="关闭提示"
                    onClick={() => removeToast(toast.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5 w-full opacity-70',
                    typeStyles[toast.type].accent
                  )}
                />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
