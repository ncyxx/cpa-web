import { useState, useCallback, useRef, useEffect } from 'react'

interface UseTurnstileOptions {
  siteKey: string
  onSuccess?: (token: string) => void
  onError?: (error: string) => void
  onExpire?: () => void
}

interface TurnstileState {
  token: string | null
  isLoading: boolean
  error: string | null
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function useTurnstile(options: UseTurnstileOptions) {
  const { siteKey, onSuccess, onError, onExpire } = options

  const [state, setState] = useState<TurnstileState>({
    token: null,
    isLoading: false,
    error: null
  })

  const widgetIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const render = useCallback((container: HTMLDivElement) => {
    containerRef.current = container

    if (!window.turnstile || !siteKey) {
      return
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (token: string) => {
          setState({ token, isLoading: false, error: null })
          onSuccess?.(token)
        },
        'error-callback': (error: string) => {
          setState(prev => ({ ...prev, isLoading: false, error }))
          onError?.(error)
        },
        'expired-callback': () => {
          setState(prev => ({ ...prev, token: null }))
          onExpire?.()
        }
      })
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err?.message }))
    }
  }, [siteKey, onSuccess, onError, onExpire])

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
      setState({ token: null, isLoading: false, error: null })
    }
  }, [])

  const remove = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [])

  useEffect(() => {
    return remove
  }, [remove])

  return {
    ...state,
    render,
    reset,
    remove
  }
}
