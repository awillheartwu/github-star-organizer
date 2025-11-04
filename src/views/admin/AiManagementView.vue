<script setup lang="ts">
import { reactive } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSwitch,
} from 'naive-ui'
import { enqueueAiSummary, enqueueAiSweep } from '../../api/admin'
import { useDialog, useMessage } from '../../utils/feedback'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const message = useMessage()
const dialog = useDialog()
const dialogStyle = { borderRadius: '16px' } as const

const singleForm = reactive({
  projectId: '',
  style: 'short' as 'short' | 'long' | 'both',
  lang: 'zh' as 'zh' | 'en',
  includeReadme: true,
})

const sweepForm = reactive({
  limit: 20,
  lang: 'zh' as 'zh' | 'en',
  force: false,
})

const enqueueSingleMutation = useMutation({
  mutationFn: async () => {
    const ids = singleForm.projectId
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const payload = {
      projectIds: ids,
      options: {
        style: singleForm.style,
        lang: singleForm.lang,
        includeReadme: singleForm.includeReadme,
      },
    }
    const result = await enqueueAiSummary(payload)
    return result
  },
  onSuccess(data) {
    message.success(`已入列 ${data.enqueued} 个项目摘要任务`)
    const time = new Date().toLocaleString()
    const queueInfo =
      typeof data.queueRemaining === 'number' ? `（队列剩余 ${data.queueRemaining} 项）` : ''
    dialog.success({
      title: '摘要任务已提交',
      content: `已入列 ${data.enqueued} 个任务${queueInfo} · 提交于 ${time}`,
      positiveText: '好的',
      style: dialogStyle,
    })
  },
  onError(error) {
    message.error(`入列失败：${(error as Error).message}`)
  },
})

const sweepMutation = useMutation({
  mutationFn: async () => {
    const payload = {
      limit: sweepForm.limit,
      lang: sweepForm.lang,
      force: sweepForm.force,
    }
    const result = await enqueueAiSweep(payload)
    return result
  },
  onSuccess(data) {
    const queuedText = data.total > 0 ? `${data.enqueued}/${data.total}` : `${data.enqueued}`
    const queueInfo =
      typeof data.queueRemaining === 'number' ? `（队列剩余 ${data.queueRemaining} 项）` : ''
    message.success(`已入列 ${queuedText} 项${queueInfo}`)
    const time = new Date().toLocaleString()
    dialog.success({
      title: '批量扫描已提交',
      content: `已入列 ${queuedText} 项${queueInfo} · 提交于 ${time}`,
      positiveText: '好的',
      style: dialogStyle,
    })
  },
  onError(error) {
    message.error(`批量扫描失败：${(error as Error).message}`)
  },
})

function enqueueSingle() {
  if (!singleForm.projectId.trim()) {
    message.warning('请填写至少一个项目 ID')
    return
  }
  enqueueSingleMutation.mutate()
}

function enqueueSweep() {
  sweepMutation.mutate()
}

const detailCardStyle = DETAIL_CARD_STYLE
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">AI 摘要管理</h2>
      <p class="text-sm text-slate-500">手动触发项目摘要生成或批量扫描</p>
    </div>

    <n-card title="单项目入列" size="large" :style="detailCardStyle">
      <n-form label-width="120" label-placement="left">
        <n-form-item label="项目 ID 列表">
          <n-input
            v-model:value="singleForm.projectId"
            type="textarea"
            placeholder="输入一个或多个项目 ID，使用逗号分隔"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
        <n-form-item label="摘要风格">
          <n-radio-group v-model:value="singleForm.style">
            <n-radio value="short">短摘要</n-radio>
            <n-radio value="long">长摘要</n-radio>
            <n-radio value="both">全部</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="语言">
          <n-radio-group v-model:value="singleForm.lang">
            <n-radio value="zh">中文</n-radio>
            <n-radio value="en">英文</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="包含 README">
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="singleForm.includeReadme" size="small" />
            <span>提交最近 README 片段给模型</span>
          </div>
        </n-form-item>
      </n-form>
      <n-button
        type="primary"
        :loading="enqueueSingleMutation.isPending.value"
        :disabled="!singleForm.projectId.trim()"
        @click="enqueueSingle"
      >
        入列摘要任务
      </n-button>
    </n-card>

    <n-card title="批量扫描" size="large" :style="detailCardStyle">
      <n-form label-width="120" label-placement="left">
        <n-form-item label="数量上限">
          <n-input-number v-model:value="sweepForm.limit" :min="1" :max="500" />
        </n-form-item>
        <n-form-item label="语言">
          <n-radio-group v-model:value="sweepForm.lang">
            <n-radio value="zh">中文</n-radio>
            <n-radio value="en">英文</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="强制刷新">
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="sweepForm.force" size="small" />
            <span>忽略最小刷新间隔，重新生成摘要</span>
          </div>
        </n-form-item>
      </n-form>
      <n-button type="primary" :loading="sweepMutation.isPending.value" @click="enqueueSweep">
        批量入列
      </n-button>
    </n-card>
  </div>
</template>
