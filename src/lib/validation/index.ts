export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmail = (value: string | null | undefined) => {
  if (!value) return false
  return EMAIL_REGEX.test(value.trim())
}
