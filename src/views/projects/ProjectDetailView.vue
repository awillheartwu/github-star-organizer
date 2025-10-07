<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NSpace,
  NSwitch,
  NTag,
  NDynamicInput,
  useDialog,
} from 'naive-ui'
import TagSelector from '../../components/common/TagSelector.vue'
import type { ProjectSummary, ProjectUpdateTag } from '../../types/project'
import { formatDate, formatNumber } from '../../utils/format'
import { useAuthStore } from '../../stores/auth'
import {
  useProjectDetailQuery,
  useProjectUpdateMutation,
  useProjectDeleteMutation,
  useProjectSummaryMutation,
} from '../../queries/projects'
import { useTagListQuery } from '../../queries/tags'
import { DETAIL_CARD_STYLE } from '../../constants/ui'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const dialog = useDialog()

const projectId = computed(() => route.params.id as string)

const projectQuery = useProjectDetailQuery(projectId)

const project = computed<ProjectSummary | undefined>(() => projectQuery.data.value)
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const projectMutation = useProjectUpdateMutation()
const projectDelete = useProjectDeleteMutation()
const aiSummaryMutation = useProjectSummaryMutation()
const pendingAction = ref<'favorite' | 'pinned' | 'summary' | null>(null)
const showEditDrawer = ref(false)
const detailCardStyle = DETAIL_CARD_STYLE

const editForm = reactive({
  notes: '',
  favorite: false,
  pinned: false,
  archived: false,
  score: null as number | null,
  tagIds: [] as string[],
  videoLinks: [] as string[],
})

const tagQuery = useTagListQuery(
  computed(() => ({ page: 1, pageSize: 100, archived: false, sort: 'name:asc' }))
)

const tagMap = computed<Map<string, ProjectUpdateTag>>(() => {
  const map = new Map<string, ProjectUpdateTag>()
  const available = tagQuery.data.value?.data ?? []
  available.forEach((tag) => {
    map.set(tag.id, {
      id: tag.id,
      name: tag.name,
      description: tag.description ?? null,
    })
  })
  project.value?.tags.forEach((tag) => {
    if (!map.has(tag.id)) {
      map.set(tag.id, {
        id: tag.id,
        name: tag.name,
        description: tag.description ?? null,
      })
    }
  })
  return map
})

const tagOptions = computed(() =>
  Array.from(tagMap.value.values()).map((tag) => ({ label: tag.name, value: tag.id as string }))
)
const tagSelectorLoading = computed(() => tagQuery.isFetching.value)

const favoriteLabel = computed(() =>
  project.value?.favorite ? '取消收藏' : '设为收藏'
)
const pinnedLabel = computed(() => (project.value?.pinned ? '取消置顶' : '设为置顶'))
const statusOverview = computed(() => {
  const target = project.value
  return {
    favorite: target?.favorite ? '已收藏' : '未收藏',
    pinned: target?.pinned ? '已置顶' : '未置顶',
    archived: target?.archived ? '已归档' : '未归档',
  }
})
const scoreDisplay = computed(() => project.value?.score ?? '--')
const notesDisplay = computed(() => project.value?.notes?.trim() || '暂无备注')
const hasNotes = computed(() => Boolean(project.value?.notes?.trim()))
const tagCountDisplay = computed(() => {
  const count = project.value?.tags.length ?? 0
  return count ? `${count} 个` : '暂无'
})
const videoCountDisplay = computed(() => {
  const count = project.value?.videoLinks.length ?? 0
  return count ? `${count} 个` : '暂无'
})

function populateEditForm(source: ProjectSummary) {
  editForm.notes = source.notes ?? ''
  editForm.favorite = source.favorite
  editForm.pinned = source.pinned
  editForm.archived = source.archived
  editForm.score = source.score ?? null
  editForm.tagIds = source.tags.map((tag) => tag.id)
  editForm.videoLinks = source.videoLinks.length ? [...source.videoLinks] : []
}

function openEditDrawer() {
  if (!project.value) return
  populateEditForm(project.value)
  showEditDrawer.value = true
}

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

async function triggerAiSummary() {
  if (!project.value || aiSummaryMutation.isPending.value) return
  pendingAction.value = 'summary'
  try {
    await aiSummaryMutation.mutateAsync({ id: project.value.id })
  } finally {
    pendingAction.value = null
  }
}

async function submitEdit() {
  if (!project.value || projectMutation.isPending.value) return
  const sanitizedNotes = editForm.notes.trim()
  const sanitizedLinks = Array.from(
    new Set(editForm.videoLinks.map((link) => link.trim()).filter(Boolean))
  )
  const selectedTags: ProjectUpdateTag[] = []
  const seen = new Set<string>()
  for (const raw of editForm.tagIds) {
    const value = raw.trim()
    if (!value) continue
    if (seen.has(value)) continue
    seen.add(value)
    const existing = tagMap.value.get(value)
    if (existing) {
      selectedTags.push(existing)
      continue
    }
    selectedTags.push({ name: value })
  }
  await projectMutation.mutateAsync({
    id: project.value.id,
    payload: {
      notes: sanitizedNotes || null,
      favorite: editForm.favorite,
      pinned: editForm.pinned,
      archived: editForm.archived,
      score: editForm.score ?? null,
      tags: selectedTags,
      videoLinks: sanitizedLinks,
    },
    successMessage: '项目已更新',
  })
  showEditDrawer.value = false
}

function confirmDelete() {
  const current = project.value
  if (!current || projectDelete.isPending.value) return
  dialog.warning({
    title: '删除项目',
    content: `确定要删除 “${current.fullName}” 吗？此操作无法撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      try {
        await projectDelete.mutateAsync(current.id)
        showEditDrawer.value = false
        await router.push({ name: 'projects' })
      } catch (error) {
        return false
      }
    },
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <n-alert v-if="projectQuery.isError.value" type="error" show-icon>
      加载项目失败，请稍后重试。
    </n-alert>

    <n-card v-if="project" size="large" :bordered="false" class="shadow-sm" :style="detailCardStyle">
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
              <n-button
                v-if="isAdmin"
                tertiary
                size="small"
                :disabled="!project"
                @click="openEditDrawer"
              >
                编辑项目
              </n-button>
              <n-button
                v-if="isAdmin"
                tertiary
                size="small"
                :loading="pendingAction === 'summary' && aiSummaryMutation.isPending.value"
                @click="triggerAiSummary"
              >
                触发 AI 摘要
              </n-button>
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

        <div
          v-if="project"
          class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700"
        >
          <h3 class="mb-2 text-sm font-semibold">管理员备注</h3>
          <span :class="{ 'opacity-60': !hasNotes }">{{ notesDisplay }}</span>
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
        <n-card title="项目信息" size="small" :style="detailCardStyle">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="创建时间">{{ formatDate(project?.createdAt) }}</n-descriptions-item>
            <n-descriptions-item label="更新时间">{{ formatDate(project?.updatedAt) }}</n-descriptions-item>
            <n-descriptions-item label="最后活跃">{{ formatDate(project?.touchedAt) }}</n-descriptions-item>
            <n-descriptions-item label="Score">{{ scoreDisplay }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="调试信息" size="small" :style="detailCardStyle">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="项目 ID">{{ project?.id }}</n-descriptions-item>
            <n-descriptions-item label="GitHub ID">{{ project?.githubId }}</n-descriptions-item>
            <n-descriptions-item label="Access Token 角色">{{ auth.user?.role ?? '未知' }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="状态与配置" size="small" :style="detailCardStyle">
          <n-descriptions :column="1" size="small">
            <n-descriptions-item label="收藏">{{ statusOverview.favorite }}</n-descriptions-item>
            <n-descriptions-item label="置顶">{{ statusOverview.pinned }}</n-descriptions-item>
            <n-descriptions-item label="归档">{{ statusOverview.archived }}</n-descriptions-item>
            <n-descriptions-item label="视频链接">{{ videoCountDisplay }}</n-descriptions-item>
            <n-descriptions-item label="关联标签">{{ tagCountDisplay }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>

  <n-drawer v-model:show="showEditDrawer" :width="420" placement="right">
    <n-drawer-content title="编辑项目" closable>
      <n-form label-placement="top" class="flex flex-col gap-4">
        <n-form-item label="备注">
          <n-input v-model:value="editForm.notes" type="textarea" placeholder="记录你的备注" rows="4" />
        </n-form-item>
        <n-form-item label="自定义评分">
          <n-input-number
            v-model:value="editForm.score"
            :min="0"
            :show-button="false"
            placeholder="可选"
            class="w-full"
          />
        </n-form-item>
        <n-form-item label="状态">
          <div class="flex flex-col gap-2 text-sm text-slate-600">
            <label class="flex items-center gap-2">
              <n-switch v-model:value="editForm.favorite" size="small" />
              <span>收藏</span>
            </label>
            <label class="flex items-center gap-2">
              <n-switch v-model:value="editForm.pinned" size="small" />
              <span>置顶</span>
            </label>
            <label class="flex items-center gap-2">
              <n-switch v-model:value="editForm.archived" size="small" />
              <span>归档</span>
            </label>
          </div>
        </n-form-item>
        <n-form-item label="标签">
          <TagSelector
            v-model:model-value="editForm.tagIds"
            :options="tagOptions"
            :loading="tagSelectorLoading"
            placeholder="选择关联标签"
          />
        </n-form-item>
        <n-form-item label="视频链接">
          <n-dynamic-input v-model:value="editForm.videoLinks" :on-create="() => ''">
            <template #default="{ index }">
              <n-input v-model:value="editForm.videoLinks[index]" placeholder="https://example.com" />
            </template>
          </n-dynamic-input>
        </n-form-item>
      </n-form>
      <div class="mt-6 flex items-center justify-between gap-2">
        <n-button quaternary @click="showEditDrawer = false">取消</n-button>
        <n-space>
          <n-button
            quaternary
            type="error"
            :loading="projectDelete.isPending.value"
            @click="confirmDelete"
          >
            删除项目
          </n-button>
          <n-button type="primary" :loading="projectMutation.isPending.value" @click="submitEdit">
            保存更改
          </n-button>
        </n-space>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>
