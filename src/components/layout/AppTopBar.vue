<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDropdown, NSpace, NSwitch, NTag } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { user } = storeToRefs(auth)
const themeStore = useThemeStore()

const pageTitle = computed(() => route.meta.title ?? '仪表盘')
const isDarkMode = computed({
  get: () => themeStore.isDark,
  set: (value) => themeStore.setMode(value ? 'dark' : 'light'),
})

const dropdownOptions = [
  { label: '账户信息', key: 'profile' },
  { label: '退出登录', key: 'logout' },
]

async function handleSelect(key: string | number) {
  if (key === 'profile') {
    await router.push({ name: 'account-profile' })
    return
  }
  if (key === 'logout') {
    await auth.logout()
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-panel)] px-6 backdrop-blur"
  >
    <div class="flex flex-col">
      <h1 class="text-lg font-semibold text-slate-900">{{ pageTitle }}</h1>
      <span class="text-xs text-slate-500">GitHub Star Organizer</span>
    </div>
    <div class="flex items-center gap-4">
      <n-switch v-model:value="isDarkMode" size="small">
        <template #checked>夜间</template>
        <template #unchecked>白天</template>
      </n-switch>
      <n-dropdown trigger="hover" :options="dropdownOptions" @select="handleSelect">
        <n-button quaternary size="small">
          <n-space align="center" size="small">
            <span>{{ user?.name ?? user?.sub ?? '未知用户' }}</span>
            <n-tag v-if="user?.role" size="tiny" type="info">{{ user.role }}</n-tag>
          </n-space>
        </n-button>
      </n-dropdown>
    </div>
  </header>
</template>
