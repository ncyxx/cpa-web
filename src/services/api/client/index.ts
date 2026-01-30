/**
 * CLI Proxy API 客户端
 * 基于 Axios 的 API 客户端，支持 Bearer Token 认证
 */

import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 常量
const MANAGEMENT_API_PREFIX = '/v0/management'
const REQUEST_TIMEOUT_MS = 30000
const VERSION_HEADER_KEYS = ['x-cpa-version', 'x-server-version', 'x-cli-proxy-version']
const BUILD_DATE_HEADER_KEYS = ['x-cpa-build-date', 'x-build-date']

export interface ApiClientConfig {
  apiBase: string
  managementKey: string
  timeout?: number
}

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
  data?: any
}

class ApiClient {
  private instance: AxiosInstance
  private apiBase: string = ''
  private managementKey: string = ''

  constructor() {
    this.instance = axios.create({
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  setConfig(config: ApiClientConfig): void {
    this.apiBase = this.normalizeApiBase(config.apiBase)
    this.managementKey = config.managementKey

    if (config.timeout) {
      this.instance.defaults.timeout = config.timeout
    } else {
      this.instance.defaults.timeout = REQUEST_TIMEOUT_MS
    }
  }

  private normalizeApiBase(base: string): string {
    let normalized = base.trim()
    normalized = normalized.replace(/\/?v0\/management\/?$/i, '')
    normalized = normalized.replace(/\/+$/, '')
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `http://${normalized}`
    }
    return `${normalized}${MANAGEMENT_API_PREFIX}`
  }

  private readHeader(headers: Record<string, any> | undefined, keys: string[]): string | null {
    if (!headers) return null

    const normalizeValue = (value: unknown): string | null => {
      if (value === undefined || value === null) return null
      if (Array.isArray(value)) {
        const first = value.find((entry) => entry !== undefined && entry !== null && String(entry).trim())
        return first !== undefined ? String(first) : null
      }
      const text = String(value)
      return text ? text : null
    }

    const headerGetter = (headers as { get?: (name: string) => any }).get
    if (typeof headerGetter === 'function') {
      for (const key of keys) {
        const match = normalizeValue(headerGetter.call(headers, key))
        if (match) return match
      }
    }

    const entries =
      typeof (headers as { entries?: () => Iterable<[string, any]> }).entries === 'function'
        ? Array.from((headers as { entries: () => Iterable<[string, any]> }).entries())
        : Object.entries(headers)

    const normalized = Object.fromEntries(
      entries.map(([key, value]) => [String(key).toLowerCase(), value])
    )
    for (const key of keys) {
      const match = normalizeValue(normalized[key.toLowerCase()])
      if (match) return match
    }
    return null
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        config.baseURL = this.apiBase
        if (this.managementKey) {
          config.headers.Authorization = `Bearer ${this.managementKey}`
        }
        return config
      },
      (error) => Promise.reject(this.handleError(error))
    )

    this.instance.interceptors.response.use(
      (response) => {
        const headers = response.headers as Record<string, string | undefined>
        const version = this.readHeader(headers, VERSION_HEADER_KEYS)
        const buildDate = this.readHeader(headers, BUILD_DATE_HEADER_KEYS)

        if (version || buildDate) {
          window.dispatchEvent(
            new CustomEvent('server-version-update', {
              detail: { version: version || null, buildDate: buildDate || null }
            })
          )
        }

        return response
      },
      (error) => Promise.reject(this.handleError(error))
    )
  }

  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as any
      const message = responseData?.error || responseData?.message || error.message || 'Request failed'
      const apiError = new Error(message) as ApiError
      apiError.name = 'ApiError'
      apiError.status = error.response?.status
      apiError.code = error.code
      apiError.details = responseData
      apiError.data = responseData

      if (error.response?.status === 401) {
        window.dispatchEvent(new Event('unauthorized'))
      }

      return apiError
    }

    const fallback = new Error(error?.message || 'Unknown error occurred') as ApiError
    fallback.name = 'ApiError'
    return fallback
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }

  async getRaw(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.get(url, config)
  }

  async postForm<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      ...config,
      headers: {
        ...(config?.headers || {}),
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

export const apiClient = new ApiClient()
