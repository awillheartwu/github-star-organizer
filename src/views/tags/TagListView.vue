<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
  NSwitch,
  NTag,
  NPagination,
} from 'naive-ui'
import FilterBar from '../../components/common/FilterBar.vue'
import type { TagListItem } from '../../types/tag'
import { formatDate } from '../../utils/format'
import { useTagListQuery, useTagMutations } from '../../queries/tags'
import { useDialog, useMessage } from '../../utils/feedback'

const router = useRouter()
const route = useRoute()
const dialog = useDialog()
const message = useMessage()

const defaultFilters = {
  keyword: '',
  archived: false,
  sort: 'updatedAt:desc',
  page: 1,
  pageSize: 20,
}

const filters = reactive({ ...defaultFilters })
let syncing = false

function syncFromRoute() {
  syncing = true
  try {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
    filters.archived = route.query.archived === 'true'
    filters.sort = typeof route.query.sort === 'string' ? route.query.sort : defaultFilters.sort
    filters.page = route.query.page ? Math.max(Number(route.query.page) || 1, 1) : 1
    filters.pageSize = route.query.pageSize
      ? Math.max(Number(route.query.pageSize) || defaultFilters.pageSize, 1)
      : defaultFilters.pageSize
  } finally {
    syncing = false
  }
}

const tagListParams = computed(() => {
  const [orderBy = '', orderDirection = 'desc'] = filters.sort.split(':')
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    archived: filters.archived,
    keyword: filters.keyword,
    sort: orderBy ? `${orderBy}:${orderDirection}` : undefined,
  }
})

const tagQuery = useTagListQuery(tagListParams)
const { createMutation, updateMutation, deleteMutation } = useTagMutations()

watch(
  () => route.query,
  () => {
    syncFromRoute()
  },
  { immediate: true }
)

watch(
  () => ({ ...filters }),
  (value) => {
    if (syncing) return
    const query: Record<string, string> = {}
    if (value.keyword) query.keyword = value.keyword
    if (value.archived) query.archived = 'true'
    if (value.sort !== defaultFilters.sort) query.sort = value.sort
    if (value.page !== 1) query.page = String(value.page)
    if (value.pageSize !== defaultFilters.pageSize) query.pageSize = String(value.pageSize)
    void router.replace({ query })
  },
  { deep: true }
)

const columns = computed<DataTableColumns<TagListItem>>(() => [
  {
    title: '名称',
    key: 'name',
    render(row) {
      return row.name
    },
  },
  {
    title: '描述',
    key: 'description',
    render(row) {
      return row.description || '--'
    },
  },
  {
    title: '状态',
    key: 'archived',
    width: 120,
    render(row) {
      const type = row.archived ? 'warning' : 'success'
      const label = row.archived ? '已归档' : '启用'
      return h(NTag, { type, size: 'small' }, { default: () => label })
    },
  },
  {
    title: '更新于',
    key: 'updatedAt',
    width: 160,
    render(row) {
      return formatDate(row.updatedAt)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                onClick: () => router.push({ name: 'tag-detail', params: { id: row.id } }),
              },
              { default: () => '查看' }
            ),
            h(
              NButton,
              {
                size: 'small',
                tertiary: true,
                onClick: () => openEditModal(row),
              },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              {
                size: 'small',
                tertiary: true,
                type: 'error',
                onClick: () => handleDelete(row),
              },
              { default: () => '删除' }
            ),
          ],
        }
      )
    },
  },
])

function resetFilters() {
  Object.assign(filters, { ...defaultFilters })
}

function handlePageSizeChange(pageSize: number) {
  filters.pageSize = pageSize
  filters.page = 1
}

const tags = computed(() => tagQuery.data.value)
const isLoading = computed(() => tagQuery.isFetching.value)
const totalItems = computed(() => tags.value?.total ?? 0)
const loadError = computed(() => tagQuery.error.value)
const hasError = computed(() => Boolean(loadError.value))
const showEmptyState = computed(() => {
  const items = tags.value?.data ?? []
  return !hasError.value && !isLoading.value && tagQuery.isFetched.value && items.length === 0
})

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

const createModalVisible = ref(false)
const editModalVisible = ref(false)
const createForm = reactive({ name: '', description: '' })
const editForm = reactive({ id: '', name: '', description: '' })

function openCreateModal() {
  createForm.name = ''
  createForm.description = ''
  createModalVisible.value = true
}

function openEditModal(row: TagListItem) {
  editForm.id = row.id
  editForm.name = row.name
  editForm.description = row.description ?? ''
  editModalVisible.value = true
}

async function submitCreate() {
  if (!createForm.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  await createMutation.mutateAsync({
    name: createForm.name.trim(),
    description: createForm.description.trim() || undefined,
  })
  createModalVisible.value = false
}

async function submitEdit() {
  if (!editForm.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  await updateMutation.mutateAsync({
    id: editForm.id,
    payload: { name: editForm.name.trim(), description: editForm.description.trim() || undefined },
  })
  editModalVisible.value = false
}

function handleDelete(row: TagListItem) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除标签 “${row.name}” 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => deleteMutation.mutate(row.id),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <FilterBar>
      <template #filters>
        <div class="flex flex-wrap items-center gap-3">
          <n-input v-model:value="filters.keyword" class="w-64" clearable placeholder="搜索标签" />
          <div class="flex items-center gap-2 text-sm text-slate-600">
            <n-switch v-model:value="filters.archived" size="small" />
            <span>仅显示归档</span>
          </div>
        </div>
      </template>
      <template #actions>
        <n-space>
          <n-button tertiary @click="resetFilters">重置</n-button>
          <n-button type="primary" secondary @click="openCreateModal">新建标签</n-button>
        </n-space>
      </template>
    </FilterBar>

    <n-data-table
      :loading="isLoading"
      :columns="columns"
      :data="tags?.data ?? []"
      :row-key="(row: TagListItem) => row.id"
      bordered
    />

    <div
      v-if="hasError"
      data-testid="tag-error"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
    >
      标签列表加载失败，请稍后重试。
    </div>
    <div
      v-else-if="showEmptyState"
      data-testid="tag-empty"
      class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500"
    >
      暂无符合条件的标签。
    </div>

    <div class="flex items-center justify-end">
      <n-pagination
        v-model:page="filters.page"
        :item-count="tags?.total ?? 0"
        :page-size="filters.pageSize"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <n-modal
      v-model:show="createModalVisible"
      preset="dialog"
      title="新建标签"
      :style="{ borderRadius: '16px' }"
    >
      <n-form label-placement="top">
        <n-form-item label="名称">
          <n-input v-model:value="createForm.name" placeholder="标签名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="createForm.description" type="textarea" placeholder="可选" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="createModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="createMutation.isPending.value" @click="submitCreate">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editModalVisible"
      preset="dialog"
      title="编辑标签"
      :style="{ borderRadius: '16px' }"
    >
      <n-form label-placement="top">
        <n-form-item label="名称">
          <n-input v-model:value="editForm.name" placeholder="标签名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="editForm.description" type="textarea" placeholder="可选" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="updateMutation.isPending.value" @click="submitEdit">
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>
