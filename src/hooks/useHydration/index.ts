/**
 * Hydration Hook
 * 解决 Zustand persist 中间件的 hydration 闪烁问题
 */

import { useEffect, useState } from 'react'

/**
 * 检测 hydration 是否完成
 * 在 hydration 完成前返回 false，完成后返回 true
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

/**
 * 在 hydration 完成前返回初始值，完成后返回实际值
 */
export function useHydratedValue<T>(value: T, initialValue: T): T {
  const hydrated = useHydration()
  return hydrated ? value : initialValue
}
