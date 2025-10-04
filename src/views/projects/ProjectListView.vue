<script setup lang="ts">

import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NInput, NSelect, NSpace, NSwitch, NSpin, NPagination } from 'naive-ui'
import FilterBar from '../../components/common/FilterBar.vue'
import TagSelector from '../../components/common/TagSelector.vue'
import ProjectCard from '../../components/projects/ProjectCard.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import type { ProjectFilters } from '../../types/project'
import type { TagListItem } from '../../types/tag'
import { useProjectsQuery } from '../../queries/projects'
import { useTagListQuery } from '../../queries/tags'

const router = useRouter()
const route = useRoute()

const defaultFilters: Required<ProjectFilters> & { pageSize: number; tagNames: string[] } = {
  keyword: '',
  language: '',
  favorite: false,
  pinned: false,
  sort: 'lastSyncAt:desc',
  page: 1,
  pageSize: 20,
  tagNames: [],
}

const filters = reactive({ ...defaultFilters })

let syncingFromRoute = false

function applyRouteQuery() {
  syncingFromRoute = true
  try {
    const { query } = route
    filters.keyword = typeof query.keyword === 'string' ? query.keyword : ''
    filters.language = typeof query.language === 'string' ? query.language : ''
    filters.favorite = query.favorite === 'true'
    filters.pinned = query.pinned === 'true'
    filters.sort = typeof query.sort === 'string' ? query.sort : defaultFilters.sort
    filters.page = query.page ? Math.max(Number(query.page) || 1, 1) : 1
    filters.pageSize = query.pageSize ? Math.max(Number(query.pageSize) || defaultFilters.pageSize, 1) : defaultFilters.pageSize
    if (Array.isArray(query.tagNames)) {
      filters.tagNames = query.tagNames.map(String)
    } else if (typeof query.tagNames === 'string') {
      filters.tagNames = [query.tagNames]
    } else {
      filters.tagNames = []
    }
  } finally {
    syncingFromRoute = false
  }
}

function buildRouteQuery(state: typeof filters) {
  const query: Record<string, string | string[]> = {}
  if (state.keyword) query.keyword = state.keyword
  if (state.language) query.language = state.language
  if (state.favorite) query.favorite = 'true'
  if (state.pinned) query.pinned = 'true'
  if (state.sort !== defaultFilters.sort) query.sort = state.sort
  if (state.page !== 1) query.page = String(state.page)
  if (state.pageSize !== defaultFilters.pageSize) query.pageSize = String(state.pageSize)
  if (state.tagNames.length) query.tagNames = [...state.tagNames]
  return query
}

watch(
  () => route.query,
  () => {
    applyRouteQuery()
  },
  { immediate: true }
)

watch(
  () => ({ ...filters }),
  (value) => {
    if (syncingFromRoute) return
    void router.replace({ query: buildRouteQuery(value) })
  },
  { deep: true }
)

const sortOptions = [
  { label: '最近同步', value: 'lastSyncAt:desc' },
  { label: '最近更新', value: 'updatedAt:desc' },
  { label: 'Star 数量', value: 'stars:desc' },
  { label: 'Fork 数量', value: 'forks:desc' },
  { label: '按名称 (A-Z)', value: 'name:asc' },
]

const projectListParams = computed(() => ({ ...filters, tagNames: [...filters.tagNames].sort() }))
const projectsQuery = useProjectsQuery(projectListParams)

const tagsQuery = useTagListQuery(computed(() => ({ page: 1, pageSize: 100 })))

const tagOptions = computed(() =>
  (tagsQuery.data.value?.data ?? []).map((tag: TagListItem) => ({ label: tag.name, value: tag.name }))
)

const languageOptions = computed(() => {
  const languages = new Set<string>()
  for (const project of projectsQuery.data.value?.data ?? []) {
    if (project.language) languages.add(project.language)
  }
  return Array.from(languages).map((lang) => ({ label: lang, value: lang }))
})

function resetFilters() {
  Object.assign(filters, { ...defaultFilters })
}

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}

const projects = computed(() => projectsQuery.data.value)
const isFetching = computed(() => projectsQuery.isFetching.value)
const isEmpty = computed(() => !projects.value || projects.value.data.length === 0)
</script>

<template>
  <div class="flex flex-col gap-6">
    <FilterBar>
      <template #filters>
        <div class="flex flex-wrap items-center gap-3">
          <n-input
            v-model:value="filters.keyword"
            class="w-64"
            clearable
            placeholder="搜索名称、描述或关键字"
          />
          <n-select
            v-model:value="filters.language"
            class="w-40"
            :options="languageOptions"
            clearable
            placeholder="语言"
          />
          <n-select v-model:value="filters.sort" class="w-44" :options="sortOptions" />
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="filters.favorite" size="small" />
            <span>仅收藏</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="filters.pinned" size="small" />
            <span>仅置顶</span>
          </div>
          <TagSelector v-model="filters.tagNames" :options="tagOptions" :loading="tagsQuery.isLoading.value" />
        </div>
      </template>
      <template #actions>
        <n-space>
          <n-button tertiary @click="resetFilters">重置</n-button>
          <n-button type="primary" secondary :loading="isFetching" @click="projectsQuery.refetch()">
            刷新
          </n-button>
        </n-space>
      </template>
    </FilterBar>

    <n-spin :show="isFetching">
      <div v-if="!isEmpty" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectCard v-for="project in projects?.data ?? []" :key="project.id" :project="project" />
      </div>
      <EmptyState v-else>暂无符合条件的项目</EmptyState>
    </n-spin>

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :page-count="Math.max(Math.ceil((projects?.total ?? 0) / filters.pageSize), 1)"
        :item-count="projects?.total ?? 0"
        :page-size="filters.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50, 100]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
