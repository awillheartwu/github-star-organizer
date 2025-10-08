import { api } from './http'
import type { ApiResponse } from './types'
import type { AuthUser } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName?: string
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/login', payload)
  return data.data.accessToken
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post<{ message: string }>('/auth/register', payload, {
    suppressGlobalMessage: true,
  })
  return data.message
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

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export async function changePassword(payload: ChangePasswordPayload) {
  const { data } = await api.post<ApiResponse<{ message: string }>>(
    '/auth/change-password',
    payload
  )
  return data.message
}

export interface AuthFeatures {
  allowRegistration: boolean
}

export async function fetchAuthFeatures() {
  const { data } = await api.get<ApiResponse<AuthFeatures>>('/auth/features')
  return data.data
}
