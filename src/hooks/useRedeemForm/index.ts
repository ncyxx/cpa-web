import { useState, useCallback } from 'react'

interface RedeemFormState {
  code: string
  isLoading: boolean
  error: string | null
  success: boolean
}

interface UseRedeemFormOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useRedeemForm(options: UseRedeemFormOptions = {}) {
  const { onSuccess, onError } = options

  const [state, setState] = useState<RedeemFormState>({
    code: '',
    isLoading: false,
    error: null,
    success: false
  })

  const setCode = useCallback((code: string) => {
    setState(prev => ({ ...prev, code, error: null }))
  }, [])

  const submit = useCallback(async () => {
    if (!state.code.trim()) {
      setState(prev => ({ ...prev, error: '请输入兑换码' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // TODO: Implement actual redeem API call
      setState(prev => ({ ...prev, isLoading: false, success: true }))
      onSuccess?.({})
    } catch (err: any) {
      const errorMsg = err?.message || '兑换失败'
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }))
      onError?.(errorMsg)
    }
  }, [state.code, onSuccess, onError])

  const reset = useCallback(() => {
    setState({ code: '', isLoading: false, error: null, success: false })
  }, [])

  return {
    ...state,
    setCode,
    submit,
    reset
  }
}
