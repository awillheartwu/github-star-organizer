<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSpace,
  NSwitch,
} from 'naive-ui'
import { triggerSyncStars, getSyncState } from '../../api/admin'
import { useMessage, useNotification } from '../../utils/feedback'
import { formatDate, formatNumber } from '../../utils/format'
import type { SyncState, SyncStatsSummary } from '../../types/admin'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const message = useMessage()
const notification = useNotification()

const formModel = reactive({
  mode: 'incremental' as 'incremental' | 'full',
  perPage: 50,
  maxPages: 0,
  softDeleteUnstarred: false,
  note: '',
})

const syncStateQuery = useQuery({
  queryKey: ['admin', 'sync-state'],
  queryFn: getSyncState,
})

const enqueueMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      mode: formModel.mode,
      perPage: formModel.perPage,
      maxPages: formModel.maxPages,
      softDeleteUnstarred: formModel.softDeleteUnstarred,
      note: formModel.note || undefined,
    }
    return triggerSyncStars(payload)
  },
  onSuccess(data) {
    const triggeredAt = new Date()
    const triggeredAtText = formatDate(triggeredAt, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    notification.success({
      title: '同步任务已提交',
      content: '任务已加入同步队列，稍后可在“最近状态”卡片中查看执行情况。',
      meta: `提交时间：${triggeredAtText} | Job ID：${data.jobId}`,
      duration: 6000,
    })
    void syncStateQuery.refetch()
  },
  onError(error) {
    message.error(`触发同步失败：${(error as Error).message}`)
  },
})
const syncState = computed<SyncState | null>(() => syncStateQuery.data.value ?? null)
const syncStats = computed<SyncStatsSummary | null>(() => syncState.value?.latestStats ?? null)

const formatDuration = (ms?: number | null) => {
  if (!ms && ms !== 0) return '--'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} 秒`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes < 60) {
    return remainingSeconds ? `${minutes} 分 ${remainingSeconds} 秒` : `${minutes} 分`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const parts: string[] = [`${hours} 小时`]
  if (remainingMinutes) parts.push(`${remainingMinutes} 分`)
  if (remainingSeconds) parts.push(`${remainingSeconds} 秒`)
  return parts.join(' ')
}

function handleSubmit() {
  enqueueMutation.mutate()
}

const detailCardStyle = DETAIL_CARD_STYLE
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">Stars 同步</h2>
      <p class="text-sm text-slate-500">手动入列 GitHub Stars 同步任务</p>
    </div>

    <n-card title="同步参数" size="large" :style="detailCardStyle">
      <n-form label-placement="left" label-width="100">
        <n-form-item label="模式">
          <n-radio-group v-model:value="formModel.mode">
            <n-radio value="incremental">增量</n-radio>
            <n-radio value="full">全量</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="每页数量">
          <n-input-number v-model:value="formModel.perPage" :min="1" :max="100" />
        </n-form-item>
        <n-form-item label="最大页数">
          <n-input-number v-model:value="formModel.maxPages" :min="0" />
        </n-form-item>
        <n-form-item label="软删除">
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="formModel.softDeleteUnstarred" size="small" />
            <span>未拉取到的 Star 标记为软删除</span>
          </div>
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="formModel.note"
            type="textarea"
            placeholder="可选，记录此次同步的上下文"
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </n-form-item>
      </n-form>
      <n-space>
        <n-button type="primary" :loading="enqueueMutation.isPending.value" @click="handleSubmit()">
          触发同步
        </n-button>
        <n-button tertiary @click="syncStateQuery.refetch()">刷新状态</n-button>
      </n-space>
    </n-card>

    <n-card title="最近状态" size="small" :style="detailCardStyle">
      <template v-if="syncState">
        <dl class="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Run</dt>
            <dd>{{ formatDate(syncState?.lastRunAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Success</dt>
            <dd>{{ formatDate(syncState?.lastSuccessAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Error</dt>
            <dd>{{ syncState?.lastError ?? '无' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Updated</dt>
            <dd>{{ formatDate(syncState?.updatedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Error At</dt>
            <dd>{{ formatDate(syncState?.lastErrorAt) }}</dd>
          </div>
        </dl>
        <n-divider v-if="syncStats" class="!my-4" />
        <dl v-if="syncStats" class="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <dt class="text-xs uppercase text-slate-400">Scanned</dt>
            <dd>{{ formatNumber(syncStats.scanned) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Created</dt>
            <dd>{{ formatNumber(syncStats.created) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Updated</dt>
            <dd>{{ formatNumber(syncStats.updated) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Unchanged</dt>
            <dd>{{ formatNumber(syncStats.unchanged) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Soft Deleted</dt>
            <dd>{{ formatNumber(syncStats.softDeleted) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Pages</dt>
            <dd>{{ formatNumber(syncStats.pages) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Rate Limit Left</dt>
            <dd>{{ formatNumber(syncStats.rateLimitRemaining ?? null) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Started At</dt>
            <dd>{{ formatDate(syncStats.startedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Finished At</dt>
            <dd>{{ formatDate(syncStats.finishedAt) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Duration</dt>
            <dd>{{ formatDuration(syncStats.durationMs) }}</dd>
          </div>
          <div v-if="syncStats.errors !== undefined">
            <dt class="text-xs uppercase text-slate-400">Errors</dt>
            <dd>{{ formatNumber(syncStats.errors) }}</dd>
          </div>
        </dl>
      </template>
      <n-alert v-else-if="syncStateQuery.isLoading.value" type="info" show-icon
        >正在加载同步状态…
      </n-alert>
      <n-alert v-else type="default" show-icon>No Data</n-alert>
    </n-card>
  </div>
</template>
