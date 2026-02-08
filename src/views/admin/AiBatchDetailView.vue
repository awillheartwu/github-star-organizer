<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NButton, NCard, NCode } from 'naive-ui'
import { getAiBatch } from '../../api/admin'
import { formatDate } from '../../utils/format'
import { DETAIL_CARD_STYLE } from '../../constants/ui'
import type { SyncStatsSummary } from '../../types/admin'

const route = useRoute()
const router = useRouter()
const batchId = computed(() => route.params.id as string)

const batchQuery = useQuery({
  queryKey: computed(() => ['admin', 'ai-batch', batchId.value]),
  enabled: computed(() => Boolean(batchId.value)),
  queryFn: async () => getAiBatch(batchId.value),
})

const batch = computed(() => batchQuery.data.value)

const statsParsed = computed<SyncStatsSummary | null>(() => {
  if (!batch.value?.statsJson) return null
  const raw = batch.value.statsJson
  if (typeof raw !== 'string') {
    return raw as SyncStatsSummary
  }
  try {
    return JSON.parse(raw) as SyncStatsSummary
  } catch (_error) {
    return null
  }
})

const statsPretty = computed(() => {
  if (!batch.value?.statsJson) return null
  if (statsParsed.value) {
    return JSON.stringify(statsParsed.value, null, 2)
  }
  return batch.value.statsJson
})

const detailCardStyle = DETAIL_CARD_STYLE

const statsSummaryItems = computed(() => {
  const stats = statsParsed.value
  if (!stats) return []
  const items: Array<{ key: string; label: string; value: string }> = []

  const pushNumber = (key: string, label: string, value?: number | null) => {
    if (typeof value !== 'number') return
    items.push({ key, label, value: value.toLocaleString() })
  }

  const pushDate = (key: string, label: string, value?: string | null) => {
    if (!value) return
    const formatted = formatDate(value)
    if (formatted === '--') return
    items.push({ key, label, value: formatted })
  }

  const pushDuration = (key: string, label: string, value?: number | null) => {
    if (typeof value !== 'number') return
    const display =
      value >= 1000 ? `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)} 秒` : `${value} 毫秒`
    items.push({ key, label, value: display })
  }

  pushNumber('scanned', '扫描', stats.scanned)
  pushNumber('created', '新建', stats.created)
  pushNumber('updated', '更新', stats.updated)
  pushNumber('unchanged', '未变化', stats.unchanged)
  pushNumber('softDeleted', '软删除', stats.softDeleted)
  pushNumber('pages', '分页数', stats.pages)
  pushNumber('errors', '错误数', stats.errors)
  pushNumber('rateLimitRemaining', '剩余速率额度', stats.rateLimitRemaining)
  pushDate('startedAt', '开始时间', stats.startedAt)
  pushDate('finishedAt', '结束时间', stats.finishedAt)
  pushDuration('durationMs', '耗时', stats.durationMs)

  return items
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">任务详情</h2>
        <p class="text-sm text-slate-500">{{ batch?.key ?? batchId }}</p>
      </div>
      <n-button tertiary @click.prevent="router.back()">返回</n-button>
    </div>

    <n-alert v-if="batchQuery.isError.value" type="error" show-icon>
      无法加载批次详情，请稍后重试。
    </n-alert>

    <n-card v-if="batch" size="large" :style="detailCardStyle">
      <dl class="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-slate-400">任务类型</dt>
          <dd>{{ batch?.source || '--' }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">创建时间</dt>
          <dd>{{ formatDate(batch?.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">最后运行</dt>
          <dd>{{ formatDate(batch.lastRunAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">最后成功</dt>
          <dd>{{ formatDate(batch.lastSuccessAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">最后失败</dt>
          <dd>{{ formatDate(batch.lastErrorAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">错误信息</dt>
          <dd class="line-clamp-3">{{ batch.lastError || '--' }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase text-slate-400">统计数据</dt>
          <dd>
            <n-card
              v-if="statsSummaryItems.length"
              size="small"
              :bordered="false"
              class="mb-3 bg-slate-50"
            >
              <div class="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div
                  v-for="item in statsSummaryItems"
                  :key="item.key"
                  class="flex flex-col gap-1 rounded-md"
                >
                  <span class="text-xs uppercase text-slate-400">{{ item.label }}</span>
                  <span class="text-base font-medium text-slate-800">{{ item.value }}</span>
                </div>
              </div>
            </n-card>
            <n-code v-if="statsPretty" :code="statsPretty" language="json" show-line-numbers />
            <span v-else class="text-slate-500">No Data</span>
          </dd>
        </div>
      </dl>
    </n-card>
  </div>
</template>
