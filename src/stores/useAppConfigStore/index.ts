import { create } from 'zustand'

const DEFAULT_TIMEZONE = 'Asia/Shanghai'
const DEFAULT_LOCALE = 'zh-CN'
const FALLBACK_TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()

export type FeatureFlags = {
  xhs: boolean
  xianyu: boolean
  payment: boolean
  openAccounts: boolean
}

export interface AppConfigState {
  timezone: string
  locale: string
  loaded: boolean
  turnstileSiteKey: string
  turnstileEnabled: boolean | null
  openAccountsEnabled: boolean
  openAccountsMaintenanceMessage: string
  features: FeatureFlags
  loadConfig: () => Promise<void>
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  timezone: DEFAULT_TIMEZONE,
  locale: DEFAULT_LOCALE,
  loaded: false,
  turnstileSiteKey: '',
  turnstileEnabled: null,
  openAccountsEnabled: true,
  openAccountsMaintenanceMessage: '平台维护中',
  features: {
    xhs: true,
    xianyu: true,
    payment: true,
    openAccounts: true,
  },

  loadConfig: async () => {
    if (get().loaded) return
    try {
      // TODO: Load config from API when needed
      set({ loaded: true })
    } catch (error) {
      console.warn('加载系统配置失败，使用默认值', error)
      set({ loaded: true })
    }
  },
}))

export const useResolvedTurnstileSiteKey = () => {
  const turnstileSiteKey = useAppConfigStore((s) => s.turnstileSiteKey)
  return (turnstileSiteKey || FALLBACK_TURNSTILE_SITE_KEY || '').trim()
}

export const useResolvedTurnstileEnabled = () => {
  const turnstileSiteKey = useAppConfigStore((s) => s.turnstileSiteKey)
  const turnstileEnabled = useAppConfigStore((s) => s.turnstileEnabled)
  const resolvedKey = (turnstileSiteKey || FALLBACK_TURNSTILE_SITE_KEY || '').trim()
  if (!resolvedKey) return false
  if (typeof turnstileEnabled === 'boolean') return turnstileEnabled
  return Boolean(resolvedKey)
}
