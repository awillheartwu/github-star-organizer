<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppTopBar from '../components/layout/AppTopBar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-slate-100 text-slate-900">
    <AppSidebar />
    <div class="flex min-h-screen flex-1 flex-col">
      <AppTopBar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
