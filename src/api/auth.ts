import { api } from './http'
import type { ApiResponse } from './types'
import type { AuthUser } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/login', payload)
  return data.data.accessToken
}

export async function refreshAccessToken() {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh')
  return data.data.accessToken
}

export async function fetchCurrentUser() {
  const { data } = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me')
  return data.data.user
}

export async function logout() {
  await api.post('/auth/logout')
}
