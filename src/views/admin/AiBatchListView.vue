<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NPagination, NSelect, NTag } from 'naive-ui'
import { listAiBatches } from '../../api/admin'
import type { AiBatchItem } from '../../types/admin'
import { formatDate } from '../../utils/format'

const router = useRouter()
const route = useRoute()
const sortFieldOptions = ['lastRunAt', 'lastSuccessAt', 'updatedAt'] as const
type SortField = (typeof sortFieldOptions)[number]
type SortOrder = 'asc' | 'desc'

const defaultFilters: {
  page: number
  pageSize: number
  sortField: SortField
  sortOrder: SortOrder
} = {
  page: 1,
  pageSize: 20,
  sortField: 'lastRunAt',
  sortOrder: 'desc',
}

const filters = reactive({ ...defaultFilters })
let syncing = false

const batchQuery = useQuery({
  queryKey: computed(() => [
    'admin',
    'ai-batches',
    {
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField,
      sortOrder: filters.sortOrder,
    },
  ]),
  queryFn: async () =>
    listAiBatches({
      page: filters.page,
      pageSize: filters.pageSize,
      sortField: filters.sortField,
      sortOrder: filters.sortOrder,
    }),
  placeholderData: keepPreviousData,
})

watch(
  () => route.query,
  () => {
    syncing = true
    try {
      filters.page = route.query.page ? Math.max(Number(route.query.page) || 1, 1) : 1
      filters.pageSize = route.query.pageSize
        ? Math.max(Number(route.query.pageSize) || defaultFilters.pageSize, 1)
        : defaultFilters.pageSize
      const sortFieldParam =
        typeof route.query.sortField === 'string' ? route.query.sortField : undefined
      const sortFieldFromRoute =
        sortFieldParam && (sortFieldOptions as readonly string[]).includes(sortFieldParam)
          ? (sortFieldParam as SortField)
          : defaultFilters.sortField
      const sortOrderFromRoute =
        route.query.sortOrder === 'asc' || route.query.sortOrder === 'desc'
          ? (route.query.sortOrder as SortOrder)
          : defaultFilters.sortOrder
      filters.sortField = sortFieldFromRoute
      filters.sortOrder = sortOrderFromRoute
    } finally {
      syncing = false
    }
  },
  { immediate: true }
)

watch(
  () => ({ ...filters }),
  (value) => {
    if (syncing) return
    const query: Record<string, string> = {}
    if (value.page !== 1) query.page = String(value.page)
    if (value.pageSize !== defaultFilters.pageSize) query.pageSize = String(value.pageSize)
    if (value.sortField !== defaultFilters.sortField) query.sortField = value.sortField
    if (value.sortOrder !== defaultFilters.sortOrder) query.sortOrder = value.sortOrder
    void router.replace({ query })
  },
  { deep: true }
)

const columns = computed<DataTableColumns<AiBatchItem>>(() => [
  {
    title: '批次 KEY',
    key: 'key',
    minWidth: 200,
  },
  {
    title: '最后运行',
    key: 'lastRunAt',
    render(row) {
      return formatDate(row.lastRunAt)
    },
  },
  {
    title: '最后成功',
    key: 'lastSuccessAt',
    render(row) {
      return formatDate(row.lastSuccessAt)
    },
  },
  {
    title: '状态',
    key: 'statsJson',
    render(row) {
      return row.statsJson
        ? h(NTag, { size: 'small', type: 'info' }, { default: () => '有统计数据' })
        : h(NTag, { size: 'small', type: 'default' }, { default: () => '待生成' })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: () => router.push({ name: 'admin-ai-batch-detail', params: { id: row.key } }),
        },
        { default: () => '查看' }
      )
    },
  },
])

const batchList = ref<AiBatchItem[]>([])
const totalItems = ref(0)
const pageSizeFromServer = ref(filters.pageSize)
const isLoading = computed(() => batchQuery.isFetching.value)
const sortOptions = [
  { label: '按时间倒序', value: 'desc' },
  { label: '按时间顺序', value: 'asc' },
]

watch(
  () => batchQuery.data.value,
  (value) => {
    if (!value) return
    batchList.value = value.data ?? []
    totalItems.value = value.total ?? 0
    pageSizeFromServer.value = value.pageSize ?? filters.pageSize
  },
  { immediate: true }
)

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}

function handleSortOrderChange(value: SortOrder) {
  filters.sortOrder = value
  filters.page = 1
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">AI 批次</h2>
        <p class="text-sm text-slate-500">查看历史摘要批次及统计</p>
      </div>
      <div class="flex items-center gap-3 text-sm text-slate-600">
        <span class="whitespace-nowrap">排序</span>
        <n-select
          size="small"
          class="w-32"
          :value="filters.sortOrder"
          :options="sortOptions"
          @update:value="handleSortOrderChange"
        />
      </div>
    </div>

    <n-data-table
      :loading="isLoading"
      :columns="columns"
      :data="batchList"
      :row-key="(row: AiBatchItem) => row.key"
      bordered
    />

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :item-count="totalItems"
        :page-size="pageSizeFromServer"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
