<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NButton, NCard, NCode, NTag } from 'naive-ui'
import { getArchivedProject } from '../../api/admin'
import { formatDate } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const archivedId = computed(() => route.params.id as string)

const archivedQuery = useQuery({
  queryKey: computed(() => ['admin', 'archived-project', archivedId.value]),
  enabled: computed(() => Boolean(archivedId.value)),
  queryFn: async () => getArchivedProject(archivedId.value),
})

const archived = computed(() => archivedQuery.data.value)

const snapshotPretty = computed(() => {
  if (!archived.value?.snapshot) return null
  try {
    return JSON.stringify(archived.value.snapshot, null, 2)
  } catch (error) {
    return String(archived.value.snapshot)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">归档详情</h2>
        <p class="text-sm text-slate-500">{{ archivedId }}</p>
      </div>
      <n-button tertiary @click="router.push({ name: 'admin-archive' })">返回列表</n-button>
    </div>

    <n-alert v-if="archivedQuery.isError.value" type="error" show-icon>
      加载归档信息失败，请稍后重试。
    </n-alert>

    <n-card v-if="archived" size="large">
      <dl class="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-slate-400">归档原因</dt>
          <dd>
            <n-tag size="small" :type="archived.reason === 'manual' ? 'warning' : 'info'">
              {{ archived.reason === 'manual' ? '手动' : '取消 Star' }}
            </n-tag>
          </dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">归档时间</dt>
          <dd>{{ formatDate(archived.archivedAt) }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase text-slate-400">快照数据</dt>
          <dd>
            <n-code v-if="snapshotPretty" :code="snapshotPretty" language="json" show-line-numbers />
            <span v-else class="text-slate-500">暂无快照数据</span>
          </dd>
        </div>
      </dl>
    </n-card>
  </div>
</template>
