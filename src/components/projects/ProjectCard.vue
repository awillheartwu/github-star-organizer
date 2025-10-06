<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NSpace, NTag } from 'naive-ui'
import type { ProjectSummary } from '../../types/project'
import { formatDate, formatNumber } from '../../utils/format'
import { useProjectUpdateMutation } from '../../queries/projects'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  project: ProjectSummary
}>()

const tags = computed(() => props.project.tags ?? [])
const isFavorite = computed(() => props.project.favorite)
const isPinned = computed(() => props.project.pinned)

const auth = useAuthStore()
const canPin = computed(() => auth.user?.role === 'ADMIN')
const router = useRouter()

const projectMutation = useProjectUpdateMutation()
const pendingAction = ref<'favorite' | 'pinned' | null>(null)

const favoriteButtonLabel = computed(() => (isFavorite.value ? '取消收藏' : '设为收藏'))
const pinnedButtonLabel = computed(() => (isPinned.value ? '取消置顶' : '设为置顶'))

async function toggleFavorite() {
  if (projectMutation.isPending.value) return
  pendingAction.value = 'favorite'
  try {
    const nextFavorite = !isFavorite.value
    await projectMutation.mutateAsync({
      id: props.project.id,
      payload: { favorite: nextFavorite },
      successMessage: nextFavorite ? '已收藏项目' : '已取消收藏',
    })
  } finally {
    pendingAction.value = null
  }
}

async function togglePinned() {
  if (!canPin.value || projectMutation.isPending.value) return
  pendingAction.value = 'pinned'
  try {
    const nextPinned = !isPinned.value
    await projectMutation.mutateAsync({
      id: props.project.id,
      payload: { pinned: nextPinned },
      successMessage: nextPinned ? '已置顶项目' : '已取消置顶',
    })
  } finally {
    pendingAction.value = null
  }
}

function goToDetail() {
  void router.push({ name: 'project-detail', params: { id: props.project.id } })
}
</script>

<template>
  <n-card size="small" class="project-card">
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <h3 class="truncate text-base font-semibold text-slate-900">
              <a :href="project.url" target="_blank" rel="noreferrer" class="hover:underline">
                {{ project.fullName }}
              </a>
            </h3>
            <n-tag v-if="project.language" size="small" type="info">{{ project.language }}</n-tag>
            <n-tag v-if="project.pinned" size="small" type="success">置顶</n-tag>
            <n-tag v-if="project.favorite" size="small" type="warning">收藏</n-tag>
          </div>
          <n-space size="small">
            <n-button
              quaternary
              size="tiny"
              :loading="pendingAction === 'favorite' && projectMutation.isPending.value"
              @click="toggleFavorite"
            >
              {{ favoriteButtonLabel }}
            </n-button>
            <n-button
              v-if="canPin"
              quaternary
              size="tiny"
              :loading="pendingAction === 'pinned' && projectMutation.isPending.value"
              @click="togglePinned"
            >
              {{ pinnedButtonLabel }}
            </n-button>
            <n-button quaternary size="tiny" @click="goToDetail">详情</n-button>
          </n-space>
        </div>
        <p v-if="project.description" class="text-sm text-slate-500">{{ project.description }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span>⭐ {{ formatNumber(project.stars) }}</span>
        <span>🍴 {{ formatNumber(project.forks) }}</span>
        <span>同步于 {{ formatDate(project.lastSyncAt) }}</span>
        <span v-if="project.lastCommit">最近提交 {{ formatDate(project.lastCommit) }}</span>
      </div>
      <div v-if="project.summaryShort" class="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        {{ project.summaryShort }}
      </div>
      <n-space v-if="tags.length" size="small" wrap>
        <n-tag v-for="tag in tags" :key="tag.id" type="default" size="small">
          {{ tag.name }}
        </n-tag>
      </n-space>
    </div>
  </n-card>
</template>

<style scoped>
.project-card {
  border-radius: 16px;
  border: 1px solid rgb(226 232 240 / 1);
}
</style>
