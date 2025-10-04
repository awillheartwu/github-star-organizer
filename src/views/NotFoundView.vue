<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NResult } from 'naive-ui'

const router = useRouter()

function goHome() {
  router.push({ name: 'projects' })
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <n-result status="404" title="页面不存在" description="抱歉，未找到对应的页面。">
      <template #footer>
        <n-button type="primary" @click="goHome">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>
