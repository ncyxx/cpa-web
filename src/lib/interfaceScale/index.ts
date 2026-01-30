const BASE_WIDTH = 1920
const MIN_SCALE = 0.75
const MAX_SCALE = 1

declare global {
  interface Window {
    __appInterfaceScaleCleanup?: () => void
  }
}

const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

export const isApplePlatform = () => {
  if (typeof navigator === 'undefined') {
    return false
  }
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''
  const userAgent = navigator.userAgent || ''
  return /mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X/i.test(userAgent)
}

const getPlatformAdjustment = (viewportWidth: number) => {
  if (!isApplePlatform()) {
    return 1
  }

  const isDesktopViewport = viewportWidth >= 1024
  if (!isDesktopViewport) {
    return 1
  }

  const deviceScale = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  if (deviceScale >= 2.5) {
    return 0.78
  }

  if (deviceScale >= 2) {
    return 0.82
  }

  return 0.9
}

const updateCssVariable = (value: number) => {
  document.documentElement.style.setProperty('--interface-scale', value.toFixed(3))
}

const computeScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }

  const viewportWidth = Math.max(window.innerWidth || BASE_WIDTH, 320)
  const widthBasedScale = viewportWidth / BASE_WIDTH
  const platformScale = getPlatformAdjustment(viewportWidth)
  return clamp(widthBasedScale * platformScale)
}

export const initInterfaceScale = () => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.__appInterfaceScaleCleanup) {
    window.__appInterfaceScaleCleanup()
  }

  const applyScale = () => {
    const scale = computeScale()
    updateCssVariable(scale)
  }

  window.addEventListener('resize', applyScale)
  window.addEventListener('orientationchange', applyScale)

  applyScale()

  window.__appInterfaceScaleCleanup = () => {
    window.removeEventListener('resize', applyScale)
    window.removeEventListener('orientationchange', applyScale)
  }
}

export const getCurrentInterfaceScale = () => {
  if (typeof window === 'undefined') {
    return 1
  }

  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--interface-scale')) || 1
}
