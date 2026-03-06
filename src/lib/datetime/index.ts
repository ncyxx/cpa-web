const DEFAULT_LOCALE = 'zh-CN'
const DEFAULT_TIMEZONE = 'Asia/Shanghai'
const formatterCache = new Map<string, Intl.DateTimeFormat>()

const DB_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/
const DB_EXPIRE_AT_REGEX = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?$/

function getFormatter(locale: string, timeZone: string) {
  const cacheKey = `${locale}-${timeZone}`
  let formatter = formatterCache.get(cacheKey)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    formatterCache.set(cacheKey, formatter)
  }
  return formatter
}

function parseDate(value: string | number | Date): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return new Date(value)
}

export interface DateFormatOptions {
  locale?: string
  timeZone?: string
}

export function formatShanghaiDate(
  value?: string | number | Date | null,
  options?: DateFormatOptions,
): string {
  if (!value) return '-'
  try {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (DB_DATETIME_REGEX.test(trimmed) || DB_EXPIRE_AT_REGEX.test(trimmed)) {
        return trimmed
      }
    }
    const date = parseDate(value)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }
    const locale = options?.locale || DEFAULT_LOCALE
    const timeZone = options?.timeZone || DEFAULT_TIMEZONE
    return getFormatter(locale, timeZone).format(date)
  } catch (error) {
    console.warn('formatShanghaiDate failed:', error)
    return '-'
  }
}
