<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDropdown, NSpace, NTag } from 'naive-ui'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { user } = storeToRefs(auth)

const pageTitle = computed(() => route.meta.title ?? '仪表盘')

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
  <header class="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
    <div class="flex flex-col">
      <h1 class="text-lg font-semibold text-slate-900">{{ pageTitle }}</h1>
      <span class="text-xs text-slate-500">GitHub Star Organizer</span>
    </div>
    <n-dropdown trigger="hover" :options="dropdownOptions" @select="handleSelect">
      <n-button quaternary size="small">
        <n-space align="center" size="small">
          <span>{{ user?.name ?? user?.sub ?? '未知用户' }}</span>
          <n-tag v-if="user?.role" size="tiny" type="info">{{ user.role }}</n-tag>
        </n-space>
      </n-button>
    </n-dropdown>
  </header>
</template>
