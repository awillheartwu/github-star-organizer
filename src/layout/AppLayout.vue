<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppTopBar from '../components/layout/AppTopBar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] transition-colors">
    <AppSidebar />
    <div class="flex min-h-screen flex-1 flex-col">
      <AppTopBar />
      <main class="flex-1 p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
