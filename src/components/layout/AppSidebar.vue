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
  options.push({
    key: 'group-main',
    label: '工作区',
    children: primaryNavigation.map((item) => ({
      key: item.key,
      label: item.label,
    })),
  })

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
  const keys: string[] = ['group-main']
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
  if (target) {
    router.push({ name: target.routeName })
  }
}
</script>

<template>
  <aside class="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white">
    <div class="flex h-16 items-center border-b border-slate-200 px-6 text-xl font-semibold">
      GitHub Stars
    </div>
    <div class="flex-1 overflow-y-auto px-2 py-4">
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        :collapsed-width="0"
        :indent="18"
        v-model:expanded-keys="expandedKeys"
        @update:value="handleUpdateValue"
      />
    </div>
  </aside>
</template>
