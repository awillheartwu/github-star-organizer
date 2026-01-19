<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10 transition-colors"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-8 shadow-xl"
    >
      <RouterView />
    </div>
  </div>
</template>
