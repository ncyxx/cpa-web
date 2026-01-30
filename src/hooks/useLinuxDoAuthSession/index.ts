import { useState, useCallback, useRef, useEffect } from 'react'

interface LinuxDoAuthSessionOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  pollInterval?: number
  timeout?: number
}

interface LinuxDoAuthSessionState {
  isLoading: boolean
  error: string | null
  authUrl: string | null
}

export function useLinuxDoAuthSession(options: LinuxDoAuthSessionOptions = {}) {
  const { onError } = options

  const [state, setState] = useState<LinuxDoAuthSessionState>({
    isLoading: false,
    error: null,
    authUrl: null
  })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const startAuth = useCallback(async () => {
    cleanup()
    setState({ isLoading: true, error: null, authUrl: null })

    try {
      // TODO: Implement actual auth flow
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (err: any) {
      const errorMsg = err?.message || 'Authentication failed'
      setState({ isLoading: false, error: errorMsg, authUrl: null })
      onError?.(errorMsg)
    }
  }, [cleanup, onError])

  const cancelAuth = useCallback(() => {
    cleanup()
    setState({ isLoading: false, error: null, authUrl: null })
  }, [cleanup])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    ...state,
    startAuth,
    cancelAuth
  }
}
