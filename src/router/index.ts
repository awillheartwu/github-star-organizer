import { createRouter, createWebHistory, type Router, type RouteRecordRaw } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import type { AuthUser } from '../types/auth'
import { useLoadingBar, useMessage } from '../utils/feedback'

type AuthStore = ReturnType<typeof useAuthStore>

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../layout/AuthLayout.vue'),
    meta: { requiresAuth: false, layout: 'auth', title: '登录' },
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('../views/auth/LoginView.vue'),
        meta: { requiresAuth: false, title: '登录' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('../layout/AppLayout.vue'),
    meta: { requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '',
        redirect: { name: 'projects' },
      },
      {
        path: 'projects',
        name: 'projects',
        component: () => import('../views/projects/ProjectListView.vue'),
        meta: { requiresAuth: true, title: '项目列表' },
      },
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('../views/projects/ProjectDetailView.vue'),
        meta: { requiresAuth: true, title: '项目详情' },
      },
      {
        path: 'tags',
        name: 'tags',
        component: () => import('../views/tags/TagListView.vue'),
        meta: { requiresAuth: true, title: '标签管理' },
      },
      {
        path: 'tags/:id',
        name: 'tag-detail',
        component: () => import('../views/tags/TagDetailView.vue'),
        meta: { requiresAuth: true, title: '标签详情' },
      },
      {
        path: 'account/profile',
        name: 'account-profile',
        component: () => import('../views/account/UserProfileView.vue'),
        meta: { requiresAuth: true, title: '账户信息' },
      },
      {
        path: 'admin',
        redirect: { name: 'admin-queues' },
        meta: { requiresAuth: true, roles: ['ADMIN'], title: '管理后台' },
      },
      {
        path: 'admin/queues',
        name: 'admin-queues',
        component: () => import('../views/admin/QueueOverviewView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: '队列概览' },
      },
      {
        path: 'admin/sync-stars',
        name: 'admin-sync-stars',
        component: () => import('../views/admin/StarsSyncView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: 'Stars 同步' },
      },
      {
        path: 'admin/ai',
        name: 'admin-ai-management',
        component: () => import('../views/admin/AiManagementView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: 'AI 管理' },
      },
      {
        path: 'admin/ai/batches',
        name: 'admin-ai-batches',
        component: () => import('../views/admin/AiBatchListView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: 'AI 批处理' },
      },
      {
        path: 'admin/ai/batches/:id',
        name: 'admin-ai-batch-detail',
        component: () => import('../views/admin/AiBatchDetailView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: 'AI 批次详情' },
      },
      {
        path: 'admin/archive',
        name: 'admin-archive',
        component: () => import('../views/admin/ArchiveListView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: '归档项目' },
      },
      {
        path: 'admin/archive/:id',
        name: 'admin-archive-detail',
        component: () => import('../views/admin/ArchiveDetailView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: '归档详情' },
      },
      {
        path: 'admin/maintenance',
        name: 'admin-maintenance',
        component: () => import('../views/admin/MaintenanceTasksView.vue'),
        meta: { requiresAuth: true, roles: ['ADMIN'], title: '维护任务' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { requiresAuth: true, title: '页面未找到' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const APP_TITLE = 'GitHub Star Organizer'

function resolveTitle(metaTitle?: string) {
  return metaTitle ? `${metaTitle} · ${APP_TITLE}` : APP_TITLE
}

function hasRole(user: AuthUser | null, roles?: string[]) {
  if (!roles || roles.length === 0) return true
  if (!user?.role) return false
  return roles.includes(user.role)
}

export function setupRouterGuards(routerInstance: Router, auth: AuthStore) {
  const message = useMessage()
  const loadingBar = useLoadingBar()
  const { isAuthenticated, user } = storeToRefs(auth)

  routerInstance.beforeEach(async (to, _from, next) => {
    loadingBar?.start()

    if (to.name === 'login' && isAuthenticated.value) {
      next({ name: 'projects' })
      return
    }

    const requiresAuth = to.meta.requiresAuth !== false
    if (requiresAuth && !isAuthenticated.value) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    if (!hasRole(user.value ?? null, to.meta.roles)) {
      message.error('没有访问权限')
      next({ name: 'projects' })
      return
    }

    next()
  })

  routerInstance.afterEach((to) => {
    if (typeof document !== 'undefined') {
      document.title = resolveTitle(to.meta.title)
    }
    loadingBar?.finish()
  })

  routerInstance.onError(() => {
    loadingBar?.error()
  })
}

export default router
