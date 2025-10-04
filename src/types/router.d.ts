import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
    title?: string
    layout?: 'app' | 'auth'
  }
}
