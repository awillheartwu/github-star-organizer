<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import {
  NConfigProvider,
  NDialogProvider,
  NLoadingBarProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  zhCN,
  dateZhCN,
} from 'naive-ui'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import { useThemeStore } from './stores/theme'

const showDevtools = import.meta.env.DEV

hljs.registerLanguage('json', json)

const themeStore = useThemeStore()
const naiveTheme = computed(() => (themeStore.isDark ? darkTheme : null))
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :hljs="hljs" :theme="naiveTheme">
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
