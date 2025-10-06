import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMessage } from '../utils/feedback'
import type { AuthUser } from '../types/auth'
import {
  fetchCurrentUser,
  login as loginRequest,
  refreshAccessToken as refreshTokenRequest,
  logout as logoutRequest,
  changePassword as changePasswordRequest,
} from '../api/auth'
import type { LoginPayload, ChangePasswordPayload } from '../api/auth'

const ACCESS_TOKEN_KEY = 'gsor.access_token'
const REFRESH_MARGIN_MS = 60_000

function getTokenExpiresAt(token: string): number | null {
  const segments = token.split('.')
  if (segments.length < 2) return null
  const payloadSegment = segments[1].replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (payloadSegment.length % 4)) % 4
  const padded = payloadSegment.padEnd(payloadSegment.length + paddingLength, '=')
  const decode = typeof globalThis.atob === 'function' ? globalThis.atob : null
  if (!decode) return null
  try {
    const payload = JSON.parse(decode(padded)) as { exp?: number }
    if (typeof payload.exp !== 'number') return null
    return payload.exp * 1000
  } catch {
    return null
  }
}

function readStoredToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

function persistToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export const useAuthStore = defineStore('auth', () => {
  const message = useMessage()

  const accessToken = ref<string | null>(readStoredToken())
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const ready = ref(false)

  let refreshPromise: Promise<string | null> | null = null
  let refreshTimer: number | null = null

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function getAccessToken() {
    return accessToken.value
  }

  function cancelScheduledRefresh() {
    if (refreshTimer != null) {
      if (typeof window !== 'undefined') {
        window.clearTimeout(refreshTimer)
      }
      refreshTimer = null
    }
  }

  function scheduleAccessTokenRefresh(token: string | null) {
    cancelScheduledRefresh()

    if (!token || typeof window === 'undefined') return
    const expiresAt = getTokenExpiresAt(token)
    if (!expiresAt) return

    const ttl = expiresAt - Date.now()
    if (ttl <= 0) {
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        refreshAccessToken().catch(() => void 0)
      }, 0)
      return
    }

    const leadTime =
      ttl > REFRESH_MARGIN_MS ? REFRESH_MARGIN_MS : Math.max(Math.floor(ttl * 0.5), 1000)
    const delay = Math.max(ttl - leadTime, 0)
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null
      refreshAccessToken().catch(() => void 0)
    }, delay)
  }

  function setToken(token: string | null) {
    accessToken.value = token
    persistToken(token)
    scheduleAccessTokenRefresh(token)
  }

  function clearAuthState() {
    setToken(null)
    user.value = null
  }

  async function fetchMe() {
    const current = await fetchCurrentUser()
    user.value = current
    return user.value
  }

  async function initialize() {
    if (ready.value) return
    try {
      if (accessToken.value) {
        scheduleAccessTokenRefresh(accessToken.value)
        await fetchMe()
      }
    } catch (error) {
      clearAuthState()
    } finally {
      ready.value = true
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const token = await loginRequest(payload)
      setToken(token)
      await fetchMe()
      message.success('登录成功')
      return user.value
    } catch (error) {
      message.error('登录失败，请检查账号和密码')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function refreshAccessToken() {
    if (refreshPromise) return refreshPromise

    refreshPromise = refreshTokenRequest()
      .then((token) => {
        setToken(token)
        return token
      })
      .catch((error) => {
        clearAuthState()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })

    return refreshPromise
  }

  async function logout(options: { silent?: boolean } = {}) {
    try {
      await logoutRequest()
    } catch (error) {
      if (!options.silent) {
        message.error('登出失败，请重试')
      }
    } finally {
      clearAuthState()
      if (!options.silent) {
        message.success('已退出登录')
      }
    }
  }

  async function changePassword(payload: ChangePasswordPayload) {
    try {
      await changePasswordRequest(payload)
      await logout({ silent: true })
      return true
    } catch (error) {
      const msg = (error as Error | undefined)?.message ?? '修改密码失败'
      message.error(msg)
      throw error
    }
  }

  return {
    accessToken,
    user,
    loading,
    ready,
    isAuthenticated,
    getAccessToken,
    initialize,
    login,
    logout,
    refreshAccessToken,
    fetchMe,
    clearAuthState,
    changePassword,
  }
})
