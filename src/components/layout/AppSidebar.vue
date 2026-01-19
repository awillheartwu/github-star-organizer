<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NMenu } from 'naive-ui'
import { adminNavigation, primaryNavigation } from '../../constants/navigation'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { user } = storeToRefs(auth)

const adminMenuItems = computed(() =>
  adminNavigation.filter((item) => !item.roles || item.roles.includes(user.value?.role ?? 'USER'))
)

const accountNavigationItem = computed(() =>
  primaryNavigation.find((item) => item.key === 'account-profile')
)

const workspaceNavigationItems = computed(() =>
  primaryNavigation.filter((item) => item.key !== 'account-profile')
)

const navigationMap = computed(() => {
  const map = new Map<string, { routeName: string }>()
  for (const item of primaryNavigation) {
    map.set(item.key, { routeName: item.routeName })
  }
  for (const item of adminMenuItems.value) {
    map.set(item.key, { routeName: item.routeName })
  }
  return map
})

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = []
  if (workspaceNavigationItems.value.length) {
    options.push({
      key: 'group-main',
      label: '工作区',
      children: workspaceNavigationItems.value.map((item) => ({
        key: item.key,
        label: item.label,
      })),
    })
  }

  if (accountNavigationItem.value) {
    options.push({
      key: 'group-account',
      label: '账户信息',
      children: [
        {
          key: accountNavigationItem.value.key,
          label: accountNavigationItem.value.label,
        },
      ],
    })
  }

  if (adminMenuItems.value.length) {
    options.push({
      key: 'group-admin',
      label: '管理后台',
      children: adminMenuItems.value.map((item) => ({
        key: item.key,
        label: item.label,
      })),
    })
  }

  return options
})

const availableGroupKeys = computed(() => {
  const keys: string[] = []
  if (workspaceNavigationItems.value.length) {
    keys.push('group-main')
  }
  if (accountNavigationItem.value) {
    keys.push('group-account')
  }
  if (adminMenuItems.value.length) {
    keys.push('group-admin')
  }
  return keys
})

const expandedKeys = ref<string[]>([])

watch(
  availableGroupKeys,
  (keys) => {
    const retained = expandedKeys.value.filter((key) => keys.includes(key))
    const existing = new Set(retained)
    const newlyAvailable = keys.filter((key) => !existing.has(key))
    expandedKeys.value = [...retained, ...newlyAvailable]
  },
  { immediate: true }
)

const activeKey = computed(() => {
  return typeof route.name === 'string' ? route.name : null
})

function handleUpdateValue(key: string) {
  const target = navigationMap.value.get(key)
  if (target?.routeName && route.name !== target.routeName) {
    router.push({ name: target.routeName })
  }
}
</script>

<template>
  <aside
    class="sticky top-0 flex h-screen w-64 flex-col self-start border-r border-[var(--app-border)] bg-[var(--app-panel)] transition-colors"
  >
    <div
      class="flex h-16 items-center border-b border-[var(--app-border)] px-6 text-xl font-semibold"
    >
      GitHub Stars
    </div>
    <div class="flex-1 overflow-y-auto px-2 py-4">
      <n-menu
        v-model:expanded-keys="expandedKeys"
        :value="activeKey"
        :options="menuOptions"
        :collapsed-width="0"
        :indent="18"
        @update:value="handleUpdateValue"
      />
    </div>
  </aside>
</template>
