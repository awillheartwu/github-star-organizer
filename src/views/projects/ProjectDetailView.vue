<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NButton, NCard, NDescriptions, NDescriptionsItem, NGrid, NGridItem, NSpace, NTag } from 'naive-ui'
import type { ProjectSummary } from '../../types/project'
import { formatDate, formatNumber } from '../../utils/format'
import { useAuthStore } from '../../stores/auth'
import { useProjectDetailQuery, useProjectUpdateMutation } from '../../queries/projects'

const route = useRoute()
const auth = useAuthStore()

const projectId = computed(() => route.params.id as string)

const projectQuery = useProjectDetailQuery(projectId)

const project = computed<ProjectSummary | undefined>(() => projectQuery.data.value)
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const projectMutation = useProjectUpdateMutation()
const pendingAction = ref<'favorite' | 'pinned' | null>(null)

const favoriteLabel = computed(() =>
  project.value?.favorite ? '取消收藏' : '设为收藏'
)
const pinnedLabel = computed(() => (project.value?.pinned ? '取消置顶' : '设为置顶'))

async function toggleFavorite() {
  if (!project.value || projectMutation.isPending.value) return
  const target = project.value
  const nextFavorite = !target.favorite
  pendingAction.value = 'favorite'
  try {
    await projectMutation.mutateAsync({
      id: target.id,
      payload: { favorite: nextFavorite },
      successMessage: nextFavorite ? '已收藏项目' : '已取消收藏',
    })
  } finally {
    pendingAction.value = null
  }
}

async function togglePinned() {
  if (!project.value || !isAdmin.value || projectMutation.isPending.value) return
  const target = project.value
  const nextPinned = !target.pinned
  pendingAction.value = 'pinned'
  try {
    await projectMutation.mutateAsync({
      id: target.id,
      payload: { pinned: nextPinned },
      successMessage: nextPinned ? '已置顶项目' : '已取消置顶',
    })
  } finally {
    pendingAction.value = null
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <n-alert v-if="projectQuery.isError.value" type="error" show-icon>
      加载项目失败，请稍后重试。
    </n-alert>

    <n-card v-if="project" size="large" :bordered="false" class="shadow-sm">
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="text-2xl font-semibold text-slate-900">{{ project.fullName }}</h2>
              <n-tag v-if="project.language" type="info">{{ project.language }}</n-tag>
              <n-tag v-if="project.pinned" type="success">置顶</n-tag>
              <n-tag v-if="project.favorite" type="warning">收藏</n-tag>
              <n-tag v-if="project.archived" type="error">已归档</n-tag>
            </div>
            <p v-if="project.description" class="max-w-3xl text-sm text-slate-600">
              {{ project.description }}
            </p>
            <n-space size="small">
              <n-button
                tertiary
                size="small"
                :loading="pendingAction === 'favorite' && projectMutation.isPending.value"
                @click="toggleFavorite"
              >
                {{ favoriteLabel }}
              </n-button>
              <n-button
                v-if="isAdmin"
                tertiary
                size="small"
                :loading="pendingAction === 'pinned' && projectMutation.isPending.value"
                @click="togglePinned"
              >
                {{ pinnedLabel }}
              </n-button>
              <n-button tag="a" :href="project.url" target="_blank" tertiary size="small">访问仓库</n-button>
              <n-button v-if="isAdmin" tertiary size="small">编辑项目</n-button>
              <n-button v-if="isAdmin" tertiary size="small">触发 AI 摘要</n-button>
            </n-space>
          </div>
          <div class="flex flex-col gap-2 text-right text-sm text-slate-500">
            <span>⭐ {{ formatNumber(project.stars) }}</span>
            <span>🍴 {{ formatNumber(project.forks) }}</span>
            <span>同步于 {{ formatDate(project.lastSyncAt) }}</span>
            <span v-if="project.lastCommit">最近提交 {{ formatDate(project.lastCommit) }}</span>
          </div>
        </div>

        <div v-if="project.summaryLong || project.summaryShort" class="grid gap-4 md:grid-cols-2">
          <div v-if="project.summaryShort" class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            <h3 class="mb-2 text-sm font-semibold text-slate-900">短摘要</h3>
            {{ project.summaryShort }}
          </div>
          <div v-if="project.summaryLong" class="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
            <h3 class="mb-2 text-sm font-semibold text-slate-900">详细摘要</h3>
            {{ project.summaryLong }}
          </div>
        </div>

        <div v-if="project.notes" class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <h3 class="mb-2 text-sm font-semibold">管理员备注</h3>
          {{ project.notes }}
        </div>

        <n-space v-if="project.tags.length" size="small" wrap>
          <n-tag v-for="tag in project.tags" :key="tag.id" type="default">{{ tag.name }}</n-tag>
        </n-space>

        <div v-if="project.videoLinks.length" class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-slate-900">相关视频</h3>
          <ul class="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li v-for="link in project.videoLinks" :key="link">
              <a :href="link" target="_blank" rel="noreferrer" class="text-primary-500 hover:underline">{{ link }}</a>
            </li>
          </ul>
        </div>
      </div>
    </n-card>

    <n-grid cols="1 640:2" x-gap="16" y-gap="16">
      <n-grid-item>
        <n-card title="项目信息" size="small">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="创建时间">{{ formatDate(project?.createdAt) }}</n-descriptions-item>
            <n-descriptions-item label="更新时间">{{ formatDate(project?.updatedAt) }}</n-descriptions-item>
            <n-descriptions-item label="最后活跃">{{ formatDate(project?.touchedAt) }}</n-descriptions-item>
            <n-descriptions-item label="Score">{{ project?.score ?? '--' }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="调试信息" size="small">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="项目 ID">{{ project?.id }}</n-descriptions-item>
            <n-descriptions-item label="GitHub ID">{{ project?.githubId }}</n-descriptions-item>
            <n-descriptions-item label="Access Token 角色">{{ auth.user?.role ?? '未知' }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>
