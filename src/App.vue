<script setup lang="ts">
import { RouterView } from 'vue-router'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  zhCN,
  dateZhCN,
} from 'naive-ui'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

const showDevtools = import.meta.env.DEV

hljs.registerLanguage('json', json)
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :hljs="hljs">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <RouterView />
            <VueQueryDevtools v-if="showDevtools" button-position="bottom-right" />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
