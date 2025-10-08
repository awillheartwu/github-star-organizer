<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NButton, NCard, NGrid, NGridItem, NStatistic } from 'naive-ui'
import { getQueuesStatus } from '../../api/admin'
import type { QueueCounts } from '../../types/admin'
import EmptyState from '../../components/common/EmptyState.vue'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const queuesQuery = useQuery({
  queryKey: ['admin', 'queues'],
  queryFn: getQueuesStatus,
  refetchInterval: 30_000,
})

const status = computed(() => queuesQuery.data.value)
const queueEntries = computed(() => {
  if (!status.value) return []
  return Object.entries(status.value.queues) as Array<[string, QueueCounts]>
})
const hasQueues = computed(() => queueEntries.value.length > 0)
const detailCardStyle = DETAIL_CARD_STYLE
</script>

<template>
  <div class="flex flex-col gap-4">
    <n-alert v-if="queuesQuery.isError.value" type="error" show-icon>
      无法获取队列状态，请稍后重试。
    </n-alert>

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">队列概览</h2>
        <p class="text-sm text-slate-500">同步、AI 摘要与维护任务的实时状态</p>
      </div>
      <n-button
        type="primary"
        secondary
        :loading="queuesQuery.isFetching.value"
        @click="queuesQuery.refetch()"
      >
        手动刷新
      </n-button>
    </div>

    <template v-if="hasQueues">
      <n-grid cols="1 640:3" x-gap="16" y-gap="16">
        <n-grid-item v-for="[name, queue] in queueEntries" :key="name">
          <n-card :title="name" size="small" :style="detailCardStyle">
            <div class="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <span class="text-xs uppercase text-slate-400">等待</span>
                <div class="text-lg font-semibold text-slate-900">{{ queue.waiting }}</div>
              </div>
              <div>
                <span class="text-xs uppercase text-slate-400">工作中</span>
                <div class="text-lg font-semibold text-slate-900">{{ queue.active }}</div>
              </div>
              <div>
                <span class="text-xs uppercase text-slate-400">延迟</span>
                <div class="text-lg font-semibold text-slate-900">{{ queue.delayed }}</div>
              </div>
              <div>
                <span class="text-xs uppercase text-slate-400">失败</span>
                <div class="text-lg font-semibold text-rose-600">{{ queue.failed }}</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </template>
    <EmptyState v-else />

    <n-card title="并发配置" size="small" :style="detailCardStyle">
      <div class="grid gap-4 md:grid-cols-3">
        <n-statistic label="AI 并发">{{ status?.config.aiSummaryConcurrency ?? '--' }}</n-statistic>
        <n-statistic label="AI RPM 限制">{{ status?.config.aiRpmLimit ?? '--' }}</n-statistic>
        <n-statistic label="同步并发">{{ status?.config.syncConcurrency ?? '--' }}</n-statistic>
      </div>
    </n-card>
  </div>
</template>
