<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <RouterView />
    </div>
  </div>
</template>
