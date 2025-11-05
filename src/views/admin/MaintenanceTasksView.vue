<script setup lang="ts">
import { h } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { NButton, NCard } from 'naive-ui'
import { runMaintenance } from '../../api/admin'
import { useDialog, useMessage } from '../../utils/feedback'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const message = useMessage()
const dialog = useDialog()
const dialogStyle = { borderRadius: '16px' } as const

const runMutation = useMutation({
  mutationFn: runMaintenance,
  onSuccess(data) {
    message.success(`维护任务已启动：${data.jobId}`)
    const triggeredAt = new Date().toLocaleString()
    dialog.success({
      title: '维护任务已触发',
      content: () =>
        h('div', { class: 'flex flex-col gap-2 text-sm text-slate-600' }, [
          h('p', { class: 'leading-relaxed text-slate-600' }, '任务已加入维护队列。'),
          h('div', { class: 'space-y-1 text-xs text-slate-400' }, [
            h('div', null, `提交时间：${triggeredAt}`),
            h('div', null, `Job ID：${data.jobId}`),
          ]),
        ]),
      positiveText: '好的',
      style: dialogStyle,
    })
  },
  onError(error) {
    message.error(`维护任务触发失败：${(error as Error).message}`)
  },
})

function executeMaintenance() {
  runMutation.mutate()
}

const detailCardStyle = DETAIL_CARD_STYLE
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">维护任务</h2>
      <p class="text-sm text-slate-500">手动执行定期清理与校验任务</p>
    </div>

    <n-card size="large" :style="detailCardStyle">
      <p class="mb-4 text-sm text-slate-600">
        维护任务将执行队列清理、令牌清理等操作，请在非高峰期使用。
      </p>
      <n-button type="primary" :loading="runMutation.isPending.value" @click="executeMaintenance">
        立即执行维护
      </n-button>
    </n-card>
  </div>
</template>
