export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  sub: string
  role?: UserRole
  type?: string
  name?: string | null
  email?: string
  createdAt?: string
  updatedAt?: string
}
