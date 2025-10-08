import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useMessage } from '../utils/feedback'

export interface AuthInterceptorContext {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
  onRefreshFailed?: () => Promise<void> | void
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  suppressGlobalMessage?: boolean
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

export function setupApiInterceptors(ctx: AuthInterceptorContext) {
  const message = useMessage()
  api.interceptors.request.use((config) => {
    const isRefreshRequest = typeof config.url === 'string' && config.url.includes('/auth/refresh')
    const token = ctx.getAccessToken()
    if (token && !isRefreshRequest) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const { response, config } = error
      if (!response || !config) {
        message.error(error.message || '网络错误')
        return Promise.reject(error)
      }

      if (response.status === 400) {
        await ctx.onRefreshFailed?.()
      }

      const retriableConfig = config as RetriableRequestConfig
      const suppressMessage = retriableConfig.suppressGlobalMessage === true
      const isRefreshRequest =
        typeof config.url === 'string' && config.url.includes('/auth/refresh')

      if (response.status === 401) {
        if (!retriableConfig._retry && !isRefreshRequest) {
          retriableConfig._retry = true
          try {
            const token = await ctx.refreshAccessToken()
            if (token) {
              retriableConfig.headers = retriableConfig.headers ?? {}
              retriableConfig.headers.Authorization = `Bearer ${token}`
              return api(retriableConfig)
            }
          } catch (refreshErr) {
            await ctx.onRefreshFailed?.()
            return Promise.reject(refreshErr)
          }
        }

        await ctx.onRefreshFailed?.()
      }

      if (!suppressMessage && response.status !== 400 && response.status !== 401) {
        const msg =
          (response.data as { message?: string } | undefined)?.message ||
          error.message ||
          '请求失败'
        message.error(msg)
      }

      return Promise.reject(error)
    }
  )
}
