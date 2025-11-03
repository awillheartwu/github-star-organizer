<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NGrid,
  NGridItem,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui'
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
const message = useMessage()

const isSpinning = computed(
  () => queuesQuery.isLoading.value || (queuesQuery.isFetching.value && !queuesQuery.isStale.value)
)
const lastUpdated = computed(() => {
  const ts = queuesQuery.dataUpdatedAt.value
  if (!ts) return null
  return new Date(ts)
})
const lastUpdatedText = computed(() =>
  lastUpdated.value ? lastUpdated.value.toLocaleString() : '尚未刷新'
)

const queueDisplayName: Record<string, string> = {
  syncStars: '同步队列',
  aiSummary: 'AI 摘要',
  maintenance: '维护任务',
}

const queueSlug = (name: string) => {
  if (name === 'syncStars') return 'sync-stars'
  if (name === 'aiSummary') return 'ai-summary'
  return name
}

const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
const showBullBoardButton = import.meta.env.DEV
const canOpenBullBoard = showBullBoardButton && isLocalHost
const bullBoardBase = canOpenBullBoard
  ? import.meta.env.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
    : window.location.origin
  : undefined

const formatRate = (rate?: number) => {
  if (typeof rate !== 'number') return '--'
  return `${(rate * 100).toFixed(1)}%`
}

const formatLimit = (value?: number) => {
  if (typeof value !== 'number') return '未限制'
  return value > 0 ? value : '未限制'
}

const formatTimestamp = (value?: number | string) => {
  if (!value) return '--'
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString()
}

const openBullBoard = (name: string) => {
  if (!canOpenBullBoard || !bullBoardBase) {
    message.warning('仅在本地环境可打开 Bull Board')
    return
  }
  const slug = queueSlug(name)
  const target = `${bullBoardBase}/admin/queues/ui/queue/${slug}`
  window.open(target, '_blank', 'noopener')
}

const descriptionsColumns = { xs: 1, m: 3 }
</script>

<template>
  <n-spin :show="isSpinning" size="small">
    <div class="flex flex-col gap-4">
      <n-alert v-if="queuesQuery.isError.value" type="error" show-icon>
        无法获取队列状态，请稍后重试。
      </n-alert>

      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">队列概览</h2>
          <p class="text-sm text-slate-500">同步、AI 摘要与维护任务的实时状态</p>
          <p class="text-xs text-slate-400">上次刷新：{{ lastUpdatedText }}</p>
        </div>
        <div class="flex items-center gap-2">
          <n-button
            type="primary"
            secondary
            :loading="queuesQuery.isFetching.value"
            @click="queuesQuery.refetch()"
          >
            手动刷新
          </n-button>
        </div>
      </div>

      <template v-if="hasQueues">
        <n-grid cols="1 1024:3" x-gap="16" y-gap="16">
          <n-grid-item v-for="[name, queue] in queueEntries" :key="name">
            <n-card :title="queueDisplayName[name] ?? name" size="small" :style="detailCardStyle">
              <template #header-extra>
                <div class="flex items-center gap-2">
                  <n-tag v-if="queue.isPaused" size="small" type="warning" bordered> 暂停中 </n-tag>
                  <span
                    v-if="queue.failed > 0 || queue.stalled > 0"
                    class="text-xs font-medium text-rose-600"
                  >
                    警告：存在失败任务
                  </span>
                </div>
              </template>
              <div class="flex flex-col gap-4">
                <div class="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-3">
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
                    <span class="text-xs uppercase text-slate-400">已完成</span>
                    <div class="text-lg font-semibold text-slate-900">{{ queue.completed }}</div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">失败</span>
                    <div class="text-lg font-semibold text-rose-600">{{ queue.failed }}</div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">阻塞</span>
                    <div class="text-lg font-semibold text-amber-600">{{ queue.stalled }}</div>
                  </div>
                </div>

                <n-divider class="my-0" />

                <div class="grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <span class="text-xs uppercase text-slate-400">等待子作业</span>
                    <div class="text-lg font-semibold text-slate-900">
                      {{ queue.waitingChildren }}
                    </div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">优先队列</span>
                    <div class="text-lg font-semibold text-slate-900">{{ queue.prioritized }}</div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">暂停</span>
                    <div class="text-lg font-semibold text-slate-900">{{ queue.paused }}</div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">总计</span>
                    <div class="text-lg font-semibold text-slate-900">{{ queue.total }}</div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">累计处理</span>
                    <div class="text-lg font-semibold text-slate-900">
                      {{ queue.totalProcessed }}
                    </div>
                  </div>
                  <div>
                    <span class="text-xs uppercase text-slate-400">成功率</span>
                    <div class="text-lg font-semibold text-slate-900">
                      {{ formatRate(queue.successRate) }}
                    </div>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <div
                    class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"
                  >
                    <span>数据更新时间：{{ formatTimestamp(queue.updatedAt) }}</span>
                    <n-button
                      v-if="showBullBoardButton"
                      size="small"
                      tertiary
                      :disabled="!canOpenBullBoard"
                      @click="openBullBoard(name)"
                    >
                      打开 Bull Board
                    </n-button>
                  </div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </template>
      <EmptyState v-else />

      <n-card title="并发配置" size="small" :style="detailCardStyle">
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <div class="text-xs text-slate-500">AI 并发</div>
            <div class="text-base font-semibold text-slate-900">
              {{ status?.config.aiSummaryConcurrency ?? '--' }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500">AI RPM 限制</div>
            <div class="text-base font-semibold text-slate-900">
              {{ formatLimit(status?.config.aiRpmLimit) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500">同步并发</div>
            <div class="text-base font-semibold text-slate-900">
              {{ status?.config.syncConcurrency ?? '--' }}
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </n-spin>
</template>
