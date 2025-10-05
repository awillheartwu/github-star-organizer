<script setup lang="ts">
import { computed, h, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NDataTable, NPagination, NTag } from 'naive-ui'
import { listAiBatches } from '../../api/admin'
import type { AiBatchItem } from '../../types/admin'
import { formatDate } from '../../utils/format'

const router = useRouter()
const route = useRoute()

const defaultFilters = {
  page: 1,
  pageSize: 20,
}

const filters = reactive({ ...defaultFilters })
let syncing = false

const batchQuery = useQuery({
  queryKey: computed(() => ['admin', 'ai-batches', { page: filters.page, pageSize: filters.pageSize }]),
  queryFn: async () => listAiBatches({ page: filters.page, pageSize: filters.pageSize }),
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

const batches = computed(() => batchQuery.data.value)
const isLoading = computed(() => batchQuery.isFetching.value)

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-semibold text-slate-900">AI 批次</h2>
      <p class="text-sm text-slate-500">查看历史摘要批次及统计</p>
    </div>

    <n-data-table
      :loading="isLoading"
      :columns="columns"
      :data="batches?.data ?? []"
      :row-key="(row: AiBatchItem) => row.key"
      bordered
    />

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :item-count="batches?.total ?? 0"
        :page-size="filters.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>
