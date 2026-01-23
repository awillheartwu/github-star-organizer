<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NInput,
  NSelect,
  NSpace,
  NSwitch,
  NSpin,
  NPagination,
  NInputNumber,
  NDatePicker,
} from 'naive-ui'
import FilterBar from '../../components/common/FilterBar.vue'
import TagSelector from '../../components/common/TagSelector.vue'
import ProjectCard from '../../components/projects/ProjectCard.vue'
import type { ProjectListQuery } from '../../api/projects'
import type { TagListQuery } from '../../api/tags'
import type { TagListItem } from '../../types/tag'
import { useProjectsQuery, useProjectLanguagesQuery } from '../../queries/projects'
import { useTagListQuery } from '../../queries/tags'

const router = useRouter()
const route = useRoute()

type FilterState = {
  keyword: string
  language: string
  languages: string[]
  favorite: boolean
  pinned: boolean
  archived: boolean
  sort: string
  page: number
  pageSize: number
  tagNames: string[]
  starsMin: number | null
  starsMax: number | null
  forksMin: number | null
  forksMax: number | null
  createdAtStart: string
  createdAtEnd: string
  updatedAtStart: string
  updatedAtEnd: string
  lastCommitStart: string
  lastCommitEnd: string
}

const defaultFilters: FilterState = {
  keyword: '',
  language: '',
  languages: [],
  favorite: false,
  pinned: false,
  archived: false,
  sort: 'lastSyncAt:desc',
  page: 1,
  pageSize: 20,
  tagNames: [],
  starsMin: null,
  starsMax: null,
  forksMin: null,
  forksMax: null,
  createdAtStart: '',
  createdAtEnd: '',
  updatedAtStart: '',
  updatedAtEnd: '',
  lastCommitStart: '',
  lastCommitEnd: '',
}

const filters = reactive<FilterState>({ ...defaultFilters })

let syncingFromRoute = false

function parseNumberParam(value: unknown) {
  if (typeof value !== 'string') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function parseArrayParam(value: unknown) {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' && value) return [value]
  return []
}

function applyRouteQuery() {
  syncingFromRoute = true
  try {
    const { query } = route
    filters.keyword = typeof query.keyword === 'string' ? query.keyword : ''
    filters.language = typeof query.language === 'string' ? query.language : ''
    filters.languages = parseArrayParam(query.languages)
    if (filters.languages.length) {
      filters.language = ''
    }
    filters.favorite = query.favorite === 'true'
    filters.pinned = query.pinned === 'true'
    filters.archived = query.archived === 'true'
    filters.sort = typeof query.sort === 'string' ? query.sort : defaultFilters.sort
    filters.page = query.page ? Math.max(Number(query.page) || 1, 1) : 1
    filters.pageSize = query.pageSize
      ? Math.max(Number(query.pageSize) || defaultFilters.pageSize, 1)
      : defaultFilters.pageSize
    if (Array.isArray(query.tagNames)) {
      filters.tagNames = query.tagNames.map(String)
    } else if (typeof query.tagNames === 'string') {
      filters.tagNames = [query.tagNames]
    } else {
      filters.tagNames = []
    }
    filters.starsMin = parseNumberParam(query.starsMin) ?? null
    filters.starsMax = parseNumberParam(query.starsMax) ?? null
    filters.forksMin = parseNumberParam(query.forksMin) ?? null
    filters.forksMax = parseNumberParam(query.forksMax) ?? null
    filters.createdAtStart = typeof query.createdAtStart === 'string' ? query.createdAtStart : ''
    filters.createdAtEnd = typeof query.createdAtEnd === 'string' ? query.createdAtEnd : ''
    filters.updatedAtStart = typeof query.updatedAtStart === 'string' ? query.updatedAtStart : ''
    filters.updatedAtEnd = typeof query.updatedAtEnd === 'string' ? query.updatedAtEnd : ''
    filters.lastCommitStart = typeof query.lastCommitStart === 'string' ? query.lastCommitStart : ''
    filters.lastCommitEnd = typeof query.lastCommitEnd === 'string' ? query.lastCommitEnd : ''
  } finally {
    syncingFromRoute = false
  }
}

function buildRouteQuery(state: typeof filters) {
  const query: Record<string, string | string[]> = {}
  if (state.keyword) query.keyword = state.keyword
  if (!state.languages.length && state.language) query.language = state.language
  if (state.languages.length) query.languages = [...state.languages]
  if (state.favorite) query.favorite = 'true'
  if (state.pinned) query.pinned = 'true'
  if (state.archived) query.archived = 'true'
  if (state.sort !== defaultFilters.sort) query.sort = state.sort
  if (state.page !== 1) query.page = String(state.page)
  if (state.pageSize !== defaultFilters.pageSize) query.pageSize = String(state.pageSize)
  if (state.tagNames.length) query.tagNames = [...state.tagNames]
  if (state.starsMin !== null) query.starsMin = String(state.starsMin)
  if (state.starsMax !== null) query.starsMax = String(state.starsMax)
  if (state.forksMin !== null) query.forksMin = String(state.forksMin)
  if (state.forksMax !== null) query.forksMax = String(state.forksMax)
  if (state.createdAtStart) query.createdAtStart = state.createdAtStart
  if (state.createdAtEnd) query.createdAtEnd = state.createdAtEnd
  if (state.updatedAtStart) query.updatedAtStart = state.updatedAtStart
  if (state.updatedAtEnd) query.updatedAtEnd = state.updatedAtEnd
  if (state.lastCommitStart) query.lastCommitStart = state.lastCommitStart
  if (state.lastCommitEnd) query.lastCommitEnd = state.lastCommitEnd
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

watch(
  () => filters.language,
  (value) => {
    if (syncingFromRoute) return
    if (value && filters.languages.length) {
      filters.languages = []
    }
  }
)

watch(
  () => [...filters.languages],
  (value) => {
    if (syncingFromRoute) return
    if (value.length && filters.language) {
      filters.language = ''
    }
  }
)

watch(
  () => [filters.starsMin, filters.starsMax],
  ([min, max]) => {
    if (min !== null && max !== null && max < min) {
      filters.starsMax = min
    }
  }
)

watch(
  () => [filters.forksMin, filters.forksMax],
  ([min, max]) => {
    if (min !== null && max !== null && max < min) {
      filters.forksMax = min
    }
  }
)

const sortOptions = [
  { label: '最近同步', value: 'lastSyncAt:desc' },
  { label: '最近更新', value: 'updatedAt:desc' },
  { label: '最近提交', value: 'lastCommit:desc' },
  { label: 'Star 数量', value: 'stars:desc' },
  { label: 'Fork 数量', value: 'forks:desc' },
  { label: '按名称 (A-Z)', value: 'name:asc' },
]

const projectListParams = computed<ProjectListQuery>(() => ({
  keyword: filters.keyword || undefined,
  language: filters.languages.length ? undefined : filters.language || undefined,
  languages: filters.languages.length ? [...filters.languages].sort() : undefined,
  favorite: filters.favorite ? true : undefined,
  pinned: filters.pinned ? true : undefined,
  archived: filters.archived,
  sort: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
  tagNames: filters.tagNames.length ? [...filters.tagNames].sort() : undefined,
  starsMin: filters.starsMin ?? undefined,
  starsMax: filters.starsMax ?? undefined,
  forksMin: filters.forksMin ?? undefined,
  forksMax: filters.forksMax ?? undefined,
  createdAtStart: filters.createdAtStart || undefined,
  createdAtEnd: filters.createdAtEnd || undefined,
  updatedAtStart: filters.updatedAtStart || undefined,
  updatedAtEnd: filters.updatedAtEnd || undefined,
  lastCommitStart: filters.lastCommitStart || undefined,
  lastCommitEnd: filters.lastCommitEnd || undefined,
}))
const projectsQuery = useProjectsQuery(projectListParams)
const projectLanguagesQuery = useProjectLanguagesQuery()

const tagQueryFilters = reactive<TagListQuery>({ page: 1, pageSize: 20 })
let tagSearchTimer: ReturnType<typeof setTimeout> | null = null

const tagsQuery = useTagListQuery(computed(() => ({ ...tagQueryFilters })))

const tagOptions = computed(() => {
  const fetched = (tagsQuery.data.value?.data ?? []) as TagListItem[]
  const optionMap = new Map<string, string>()
  for (const tag of fetched) {
    optionMap.set(tag.name, tag.name)
  }
  for (const name of filters.tagNames) {
    if (!optionMap.has(name)) {
      optionMap.set(name, name)
    }
  }
  return Array.from(optionMap.entries()).map(([value, label]) => ({ label, value }))
})

const languageOptions = computed(() => {
  const languages = new Set(projectLanguagesQuery.data.value ?? [])
  if (filters.language) languages.add(filters.language)
  for (const lang of filters.languages) languages.add(lang)
  return Array.from(languages)
    .sort((a, b) => a.localeCompare(b))
    .map((lang) => ({ label: lang, value: lang }))
})

const createdAtValue = computed<[number, number] | null>(() => {
  if (!filters.createdAtStart || !filters.createdAtEnd) return null
  const start = Date.parse(filters.createdAtStart)
  const end = Date.parse(filters.createdAtEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return [start, end]
})

const updatedAtValue = computed<[number, number] | null>(() => {
  if (!filters.updatedAtStart || !filters.updatedAtEnd) return null
  const start = Date.parse(filters.updatedAtStart)
  const end = Date.parse(filters.updatedAtEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return [start, end]
})

const lastCommitValue = computed<[number, number] | null>(() => {
  if (!filters.lastCommitStart || !filters.lastCommitEnd) return null
  const start = Date.parse(filters.lastCommitStart)
  const end = Date.parse(filters.lastCommitEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return [start, end]
})

function updateCreatedAtRange(value: [number, number] | null) {
  if (!value) {
    filters.createdAtStart = ''
    filters.createdAtEnd = ''
    return
  }
  filters.createdAtStart = new Date(value[0]).toISOString()
  filters.createdAtEnd = new Date(value[1]).toISOString()
}

function updateUpdatedAtRange(value: [number, number] | null) {
  if (!value) {
    filters.updatedAtStart = ''
    filters.updatedAtEnd = ''
    return
  }
  filters.updatedAtStart = new Date(value[0]).toISOString()
  filters.updatedAtEnd = new Date(value[1]).toISOString()
}

function updateLastCommitRange(value: [number, number] | null) {
  if (!value) {
    filters.lastCommitStart = ''
    filters.lastCommitEnd = ''
    return
  }
  filters.lastCommitStart = new Date(value[0]).toISOString()
  filters.lastCommitEnd = new Date(value[1]).toISOString()
}

function resetFilters() {
  Object.assign(filters, { ...defaultFilters })
}

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}

const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/g

const projects = computed(() => {
  const raw = projectsQuery.data.value
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (error) {
      try {
        const sanitized = (raw as string).replace(CONTROL_CHAR_PATTERN, ' ')
        return JSON.parse(sanitized)
      } catch (innerError) {
        console.error('无法解析 projects 响应', error, innerError)
        return undefined
      }
    }
  }
  return raw
})
const projectItems = computed(() => projects.value?.data ?? [])
const hasLoaded = computed(() => projects.value !== undefined)
const isFetching = computed(() => projectsQuery.isFetching.value)
const isEmpty = computed(() => hasLoaded.value && projectItems.value.length === 0)
const loadError = computed(() => projectsQuery.error.value)
const hasError = computed(() => Boolean(loadError.value))
const showEmptyState = computed(() => !hasError.value && isEmpty.value)

const totalItems = computed(() => projects.value?.total ?? 0)

watch(
  () => [totalItems.value, filters.pageSize],
  ([total, pageSize]) => {
    const maxPage = Math.max(Math.ceil(total / pageSize), 1)
    if (filters.page > maxPage) {
      filters.page = maxPage
    }
  },
  { immediate: true }
)

function handleTagSearch(value: string) {
  if (tagSearchTimer) {
    clearTimeout(tagSearchTimer)
  }
  tagSearchTimer = setTimeout(() => {
    const keyword = value.trim()
    tagQueryFilters.keyword = keyword ? keyword : undefined
    tagQueryFilters.pageSize = keyword ? 100 : 20
    tagQueryFilters.page = 1
  }, 300)
}

onBeforeUnmount(() => {
  if (tagSearchTimer) {
    clearTimeout(tagSearchTimer)
    tagSearchTimer = null
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <FilterBar>
      <template #filters>
        <div class="flex flex-col gap-5">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">关键词</div>
              <n-input
                v-model:value="filters.keyword"
                clearable
                placeholder="输入名称、描述或关键字"
              />
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">主要语言</div>
              <n-select
                v-model:value="filters.language"
                :options="languageOptions"
                :loading="projectLanguagesQuery.isLoading.value"
                clearable
                placeholder="选择主要语言"
              />
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">多语言筛选</div>
              <n-select
                v-model:value="filters.languages"
                multiple
                filterable
                max-tag-count="responsive"
                :options="languageOptions"
                :loading="projectLanguagesQuery.isLoading.value"
                placeholder="选择需要包含的语言"
              />
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">排序方式</div>
              <n-select v-model:value="filters.sort" :options="sortOptions" />
            </div>
            <div
              class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner md:col-span-2 xl:col-span-1"
            >
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">标签</div>
              <TagSelector
                v-model="filters.tagNames"
                class="w-full"
                :options="tagOptions"
                :loading="tagsQuery.isFetching.value"
                remote
                @search="handleTagSearch"
              />
            </div>
            <div
              class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner md:col-span-2 xl:col-span-1"
            >
              <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500">快捷选项</div>
              <div class="flex flex-wrap gap-4 text-sm text-slate-600">
                <label class="flex items-center gap-2">
                  <n-switch v-model:value="filters.favorite" size="small" />
                  <span>仅收藏</span>
                </label>
                <label class="flex items-center gap-2">
                  <n-switch v-model:value="filters.pinned" size="small" />
                  <span>仅置顶</span>
                </label>
                <label class="flex items-center gap-2">
                  <n-switch v-model:value="filters.archived" size="small" />
                  <span>仅归档</span>
                </label>
              </div>
            </div>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-3 text-xs font-semibold tracking-wide text-slate-500">仓库指标</div>
              <div class="grid gap-3 sm:grid-cols-2">
                <n-input-number
                  v-model:value="filters.starsMin"
                  class="w-full"
                  :min="0"
                  :clearable="true"
                  placeholder="输入数量"
                >
                  <template #prefix>星标</template>
                  <template #suffix>以上</template>
                </n-input-number>
                <n-input-number
                  v-model:value="filters.starsMax"
                  class="w-full"
                  :min="0"
                  :clearable="true"
                  placeholder="输入数量"
                >
                  <template #prefix>星标</template>
                  <template #suffix>以下</template>
                </n-input-number>
                <n-input-number
                  v-model:value="filters.forksMin"
                  class="w-full"
                  :min="0"
                  :clearable="true"
                  placeholder="输入数量"
                >
                  <template #prefix>分叉</template>
                  <template #suffix>以上</template>
                </n-input-number>
                <n-input-number
                  v-model:value="filters.forksMax"
                  class="w-full"
                  :min="0"
                  :clearable="true"
                  placeholder="输入数量"
                >
                  <template #prefix>分叉</template>
                  <template #suffix>以下</template>
                </n-input-number>
              </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div class="mb-3 text-xs font-semibold tracking-wide text-slate-500">时间范围</div>
              <div class="flex flex-col gap-3">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="min-w-[72px] text-xs font-semibold tracking-wide text-slate-500"
                    >创建时间</span
                  >
                  <n-date-picker
                    class="flex-1 min-w-[220px]"
                    type="datetimerange"
                    clearable
                    :value="createdAtValue"
                    placeholder="选择创建时间区间"
                    @update:value="updateCreatedAtRange"
                  />
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="min-w-[72px] text-xs font-semibold tracking-wide text-slate-500"
                    >更新时间</span
                  >
                  <n-date-picker
                    class="flex-1 min-w-[220px]"
                    type="datetimerange"
                    clearable
                    :value="updatedAtValue"
                    placeholder="选择更新时间区间"
                    @update:value="updateUpdatedAtRange"
                  />
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <span class="min-w-[72px] text-xs font-semibold tracking-wide text-slate-500"
                    >最近提交时间</span
                  >
                  <n-date-picker
                    class="flex-1 min-w-[220px]"
                    type="datetimerange"
                    clearable
                    :value="lastCommitValue"
                    placeholder="选择最近提交时间区间"
                    @update:value="updateLastCommitRange"
                  />
                </div>
              </div>
            </div>
          </div>
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
      <div
        v-if="hasError"
        data-testid="project-error"
        class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
      >
        加载项目列表失败，请稍后重试。
      </div>
      <div
        v-else-if="showEmptyState"
        data-testid="project-empty"
        class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500"
      >
        暂无符合条件的项目。
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectCard v-for="project in projectItems" :key="project.id" :project="project" />
      </div>
    </n-spin>

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :item-count="totalItems"
        :page-size="filters.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50, 100]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
