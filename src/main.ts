import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import App from './App.vue'
import router, { setupRouterGuards } from './router'
import { setupApiInterceptors } from './api/http'
import { useAuthStore } from './stores/auth'
import naive from './plugins/naive'
import './assets/main.css'
import './style.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(naive)

  const auth = useAuthStore(pinia)

  setupApiInterceptors({
    getAccessToken: () => auth.getAccessToken(),
    refreshAccessToken: () => auth.refreshAccessToken(),
    onRefreshFailed: async () => {
      auth.clearAuthState()
      const current = router.currentRoute.value
      if (current.name !== 'login') {
        await router.replace({ name: 'login', query: { redirect: current.fullPath } })
      }
    },
  })

  setupRouterGuards(router, auth)

  const vueQueryOptions: VueQueryPluginOptions = {
    queryClientConfig: {
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
        mutations: {
          retry: 0,
        },
      },
    },
  }

  app.use(VueQueryPlugin, vueQueryOptions)
  app.use(router)

  try {
    await auth.initialize()
  } catch (error) {
    console.error('Auth initialization failed', error)
  }

  await router.isReady()
  app.mount('#app')
}

void bootstrap()
