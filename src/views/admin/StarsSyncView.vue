<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useMutation, useQuery } from '@tanstack/vue-query'
import {
  NAlert,
  NButton,
  NCard,
  NResult,
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
import { useMessage } from '../../utils/feedback'
import type { SyncState } from '../../types/admin'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const message = useMessage()

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

const lastTrigger = ref<{ jobId: string; triggeredAt: string } | null>(null)

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
    message.success(`已入列任务：${data.jobId}`)
    lastTrigger.value = { jobId: data.jobId, triggeredAt: new Date().toISOString() }
    void syncStateQuery.refetch()
  },
  onError(error) {
    message.error(`触发同步失败：${(error as Error).message}`)
  },
})

const syncState = computed<SyncState | null | undefined>(() => syncStateQuery.data.value ?? null)

const lastTriggerDescription = computed(() => {
  if (!lastTrigger.value) return ''
  const triggeredAt = new Date(lastTrigger.value.triggeredAt).toLocaleString()
  return `Job ID: ${lastTrigger.value.jobId} · 提交于 ${triggeredAt}`
})

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

    <n-result
      v-if="lastTrigger"
      status="success"
      title="同步任务已提交"
      :description="lastTriggerDescription"
    />

    <n-card title="最近状态" size="small" :style="detailCardStyle">
      <template v-if="syncState">
        <dl class="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Run</dt>
            <dd>{{ syncState?.lastRunAt ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Success</dt>
            <dd>{{ syncState?.lastSuccessAt ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Last Error</dt>
            <dd>{{ syncState?.lastError ?? '无' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400">Updated</dt>
            <dd>{{ syncState?.updatedAt }}</dd>
          </div>
        </dl>
      </template>
      <n-alert v-else-if="syncStateQuery.isLoading.value" type="info" show-icon
        >正在加载同步状态…</n-alert
      >
      <n-alert v-else type="default" show-icon>No Data</n-alert>
    </n-card>
  </div>
</template>
