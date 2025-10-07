<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { NAlert, NButton, NCard, NCode } from 'naive-ui'
import { getAiBatch } from '../../api/admin'
import { formatDate } from '../../utils/format'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const route = useRoute()
const router = useRouter()
const batchKey = computed(() => route.params.id as string)

const batchQuery = useQuery({
  queryKey: computed(() => ['admin', 'ai-batch', batchKey.value]),
  enabled: computed(() => Boolean(batchKey.value)),
  queryFn: async () => getAiBatch(batchKey.value),
})

const batch = computed(() => batchQuery.data.value)

const statsPretty = computed(() => {
  if (!batch.value?.statsJson) return null
  try {
    return JSON.stringify(JSON.parse(batch.value.statsJson), null, 2)
  } catch (error) {
    return batch.value.statsJson
  }
})

const detailCardStyle = DETAIL_CARD_STYLE
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">AI 批次详情</h2>
        <p class="text-sm text-slate-500">{{ batchKey }}</p>
      </div>
      <n-button tertiary @click.prevent="router.back()">返回</n-button>
    </div>

    <n-alert v-if="batchQuery.isError.value" type="error" show-icon>
      无法加载批次详情，请稍后重试。
    </n-alert>

    <n-card v-if="batch" size="large" :style="detailCardStyle">
      <dl class="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <dt class="text-xs uppercase text-slate-400">最后运行</dt>
          <dd>{{ formatDate(batch.lastRunAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs uppercase text-slate-400">最后成功</dt>
          <dd>{{ formatDate(batch.lastSuccessAt) }}</dd>
        </div>
        <div class="md:col-span-2">
          <dt class="text-xs uppercase text-slate-400">统计数据</dt>
          <dd>
            <n-code v-if="statsPretty" :code="statsPretty" language="json" show-line-numbers />
            <span v-else class="text-slate-500">No Data</span>
          </dd>
        </div>
      </dl>
    </n-card>
  </div>
</template>
