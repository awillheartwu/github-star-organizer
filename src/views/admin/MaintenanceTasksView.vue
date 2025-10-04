<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { NButton, NCard, NResult } from 'naive-ui'
import { runMaintenance } from '../../api/admin'
import { useMessage } from '../../utils/feedback'

const message = useMessage()
const lastJobId = ref<string | null>(null)

const runMutation = useMutation({
  mutationFn: runMaintenance,
  onSuccess(data) {
    lastJobId.value = data.jobId
    message.success(`维护任务已启动：${data.jobId}`)
  },
  onError(error) {
    message.error(`维护任务触发失败：${(error as Error).message}`)
  },
})

function executeMaintenance() {
  runMutation.mutate()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">维护任务</h2>
      <p class="text-sm text-slate-500">手动执行定期清理与校验任务</p>
    </div>

    <n-card size="large">
      <p class="mb-4 text-sm text-slate-600">
        维护任务将执行队列清理、令牌清理等操作，请在非高峰期使用。
      </p>
      <n-button type="primary" :loading="runMutation.isPending.value" @click="executeMaintenance">
        立即执行维护
      </n-button>
    </n-card>

    <n-result
      v-if="lastJobId"
      status="success"
      title="已触发维护任务"
      :description="`Job ID: ${lastJobId}`"
    />
  </div>
</template>
