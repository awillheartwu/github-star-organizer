<script setup lang="ts">
import { computed } from 'vue'
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

const navigationMap = computed(() => {
  const map = new Map<string, { routeName: string }>()
  for (const item of primaryNavigation) {
    map.set(item.key, { routeName: item.routeName })
  }
  for (const item of adminNavigation) {
    if (item.roles && !item.roles.includes(user.value?.role ?? 'USER')) continue
    map.set(item.key, { routeName: item.routeName })
  }
  return map
})

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = []
  options.push({
    key: 'group-main',
    type: 'group',
    label: '工作区',
    children: primaryNavigation.map((item) => ({
      key: item.key,
      label: item.label,
    })),
  })

  const adminItems = adminNavigation.filter((item) => !item.roles || item.roles.includes(user.value?.role ?? 'USER'))
  if (adminItems.length) {
    options.push({
      key: 'group-admin',
      type: 'group',
      label: '管理后台',
      children: adminItems.map((item) => ({
        key: item.key,
        label: item.label,
      })),
    })
  }

  return options
})

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
  <aside class="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
    <div class="flex h-16 items-center border-b border-slate-200 px-6 text-xl font-semibold">
      GitHub Stars
    </div>
    <div class="flex-1 overflow-y-auto px-2 py-4">
      <n-menu
        :value="activeKey"
        :options="menuOptions"
        :collapsed-width="0"
        :indent="18"
        @update:value="handleUpdateValue"
      />
    </div>
  </aside>
</template>
