<script setup lang="ts">
import { computed, h, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NPagination, NSelect, NTag } from 'naive-ui'
import { listArchivedProjects } from '../../api/admin'
import type { ArchivedProjectSnapshot } from '../../types/admin'
import { formatDate } from '../../utils/format'

const router = useRouter()
const route = useRoute()

const defaultFilters = {
  page: 1,
  pageSize: 20,
  reason: '' as '' | 'manual' | 'unstarred',
}

const filters = reactive({ ...defaultFilters })
let syncing = false

const archivedQuery = useQuery({
  queryKey: computed(() => [
    'admin',
    'archived-projects',
    { page: filters.page, pageSize: filters.pageSize, reason: filters.reason },
  ]),
  queryFn: async () =>
    listArchivedProjects({
      page: filters.page,
      pageSize: filters.pageSize,
      reason: filters.reason || undefined,
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
      filters.reason =
        route.query.reason === 'manual' || route.query.reason === 'unstarred'
          ? route.query.reason
          : ''
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
    if (value.reason) query.reason = value.reason
    void router.replace({ query })
  },
  { deep: true }
)

const columns = computed<DataTableColumns<ArchivedProjectSnapshot>>(() => [
  {
    title: '项目 ID',
    key: 'id',
    minWidth: 200,
  },
  {
    title: '归档原因',
    key: 'reason',
    width: 160,
    render(row) {
      const type = row.reason === 'manual' ? 'warning' : 'info'
      const label = row.reason === 'manual' ? '手动' : '取消 Star'
      return h(NTag, { type, size: 'small' }, { default: () => label })
    },
  },
  {
    title: '归档时间',
    key: 'archivedAt',
    render(row) {
      return formatDate(row.archivedAt)
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
          onClick: () => router.push({ name: 'admin-archive-detail', params: { id: row.id } }),
        },
        { default: () => '查看详情' }
      )
    },
  },
])

const archived = computed(() => archivedQuery.data.value)
const isLoading = computed(() => archivedQuery.isFetching.value)
const reasonOptions = [
  { label: '全部', value: '' },
  { label: '手动', value: 'manual' },
  { label: '取消 Star', value: 'unstarred' },
]

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}

function handleReasonChange(value: '' | 'manual' | 'unstarred') {
  filters.reason = value
  filters.page = 1
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">归档项目</h2>
        <p class="text-sm text-slate-500">查看已归档仓库及归档原因</p>
      </div>
      <div class="flex items-center gap-3 text-sm text-slate-600">
        <span class="whitespace-nowrap">原因筛选</span>
        <n-select
          size="small"
          class="w-32"
          :value="filters.reason"
          :options="reasonOptions"
          @update:value="handleReasonChange"
        />
      </div>
    </div>

    <n-data-table
      :loading="isLoading"
      :columns="columns"
      :data="archived?.data ?? []"
      :row-key="(row: ArchivedProjectSnapshot) => row.id"
      bordered
    />

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :item-count="archived?.total ?? 0"
        :page-size="filters.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
