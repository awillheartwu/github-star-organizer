export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  sub: string
  role?: UserRole
  type?: string
}
