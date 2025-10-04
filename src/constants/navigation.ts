import type { MenuOption } from 'naive-ui'
import type { UserRole } from '../types/auth'

export interface NavigationItem {
  key: string
  label: string
  routeName: string
  roles?: UserRole[]
}

export const primaryNavigation: NavigationItem[] = [
  { key: 'projects', label: '项目', routeName: 'projects' },
  { key: 'tags', label: '标签', routeName: 'tags' },
]

export const adminNavigation: NavigationItem[] = [
  { key: 'admin-queues', label: '队列概览', routeName: 'admin-queues', roles: ['ADMIN'] },
  { key: 'admin-sync-stars', label: 'Stars 同步', routeName: 'admin-sync-stars', roles: ['ADMIN'] },
  { key: 'admin-ai-management', label: 'AI 管理', routeName: 'admin-ai-management', roles: ['ADMIN'] },
  { key: 'admin-ai-batches', label: 'AI 批次', routeName: 'admin-ai-batches', roles: ['ADMIN'] },
  { key: 'admin-archive', label: '归档项目', routeName: 'admin-archive', roles: ['ADMIN'] },
  { key: 'admin-maintenance', label: '维护任务', routeName: 'admin-maintenance', roles: ['ADMIN'] },
]

export function toMenuOptions(items: NavigationItem[]): MenuOption[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
  }))
}
