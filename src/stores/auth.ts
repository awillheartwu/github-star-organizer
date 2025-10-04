import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMessage } from '../utils/feedback'
import type { AuthUser } from '../types/auth'
import {
  fetchCurrentUser,
  login as loginRequest,
  refreshAccessToken as refreshTokenRequest,
  logout as logoutRequest,
} from '../api/auth'
import type { LoginPayload } from '../api/auth'

const ACCESS_TOKEN_KEY = 'gsor.access_token'

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

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function getAccessToken() {
    return accessToken.value
  }

  function setToken(token: string | null) {
    accessToken.value = token
    persistToken(token)
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
  }
})
