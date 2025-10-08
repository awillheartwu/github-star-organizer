import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    suppressGlobalMessage?: boolean
  }

  interface InternalAxiosRequestConfig {
    suppressGlobalMessage?: boolean
    _retry?: boolean
  }
}
