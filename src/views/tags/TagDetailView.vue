<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NInput,
  NList,
  NListItem,
  NModal,
  NPagination,
  NSpace,
  NTag,
} from 'naive-ui'
import { formatDate } from '../../utils/format'
import { useTagDetailQuery, useTagMutations } from '../../queries/tags'
import { DETAIL_CARD_STYLE } from '../../constants/ui'
import { useMessage } from '../../utils/feedback'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const pagination = reactive({ page: 1, pageSize: 20 })

const tagParams = computed(() => {
  const id = typeof route.params.id === 'string' ? route.params.id : undefined
  return {
    id,
    projectsPage: pagination.page,
    projectsPageSize: pagination.pageSize,
  }
})

const tagQuery = useTagDetailQuery(tagParams)
const { updateMutation } = useTagMutations()

const tag = computed(() => tagQuery.data.value)
const detailCardStyle = DETAIL_CARD_STYLE
const isLoadingProjects = computed(() => tagQuery.isFetching.value)
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'ADMIN')
const showProjectsPagination = computed(() => {
  const current = tag.value
  if (!current) return false
  const total = current.projectsTotal ?? 0
  const size = current.projectsPageSize ?? 0
  return total > size && size > 0
})

const editModalVisible = ref(false)
const editForm = reactive({
  name: '',
  description: '',
})

watch(
  () => tagParams.value.id,
  () => {
    pagination.page = 1
  }
)

watch(
  () => tag.value,
  (value) => {
    if (!value) return
    if (typeof value.projectsPage === 'number' && value.projectsPage !== pagination.page) {
      pagination.page = value.projectsPage
    }
    if (
      typeof value.projectsPageSize === 'number' &&
      value.projectsPageSize !== pagination.pageSize
    ) {
      pagination.pageSize = value.projectsPageSize
    }
  }
)

function handlePageChange(page: number) {
  pagination.page = page
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
}

function openEditModal() {
  if (!tag.value) return
  editForm.name = tag.value.name ?? ''
  editForm.description = tag.value.description ?? ''
  editModalVisible.value = true
}

async function submitEdit() {
  const current = tag.value
  if (!current) return
  if (!editForm.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  await updateMutation.mutateAsync({
    id: current.id,
    payload: {
      name: editForm.name.trim(),
      description: editForm.description.trim() || undefined,
    },
  })
  editModalVisible.value = false
  await tagQuery.refetch()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <n-alert v-if="tagQuery.isError.value" type="error" show-icon>
      加载标签信息失败，请稍后重试。
    </n-alert>

    <n-card v-if="tag" size="large" :bordered="false" class="shadow-sm" :style="detailCardStyle">
      <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-semibold text-slate-900">{{ tag.name }}</h2>
              <n-tag v-if="tag.archived" type="warning">已归档</n-tag>
            </div>
            <p v-if="tag.description" class="mt-2 max-w-2xl text-sm text-slate-600">
              {{ tag.description }}
            </p>
          </div>
          <n-space>
            <n-button tertiary @click="openEditModal">编辑</n-button>
            <n-button tertiary @click="router.push({ name: 'tags' })">返回列表</n-button>
          </n-space>
        </div>

        <n-descriptions :column="1" size="small">
          <n-descriptions-item label="创建于">{{ formatDate(tag.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="更新于">{{ formatDate(tag.updatedAt) }}</n-descriptions-item>
          <n-descriptions-item v-if="isAdmin" label="标签 ID">{{ tag.id }}</n-descriptions-item>
        </n-descriptions>
      </div>
    </n-card>

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

    <n-card title="相关项目" size="small" :style="detailCardStyle">
      <n-list bordered :show-divider="false">
        <template v-if="isLoadingProjects">
          <n-list-item>
            <span class="text-sm text-slate-500">加载中...</span>
          </n-list-item>
        </template>
        <template v-else-if="tag?.projects?.length">
          <n-list-item v-for="project in tag.projects" :key="project.id">
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-900">{{
                  project.fullName ?? project.name
                }}</span>
                <n-button
                  size="tiny"
                  quaternary
                  @click="router.push({ name: 'project-detail', params: { id: project.id } })"
                >
                  查看详情
                </n-button>
              </div>
              <a
                v-if="project.url"
                :href="project.url"
                target="_blank"
                rel="noreferrer"
                class="text-xs text-primary-500"
              >
                {{ project.url }}
              </a>
            </div>
          </n-list-item>
        </template>
        <n-list-item v-else>
          <span class="text-sm text-slate-500">暂无相关项目</span>
        </n-list-item>
      </n-list>
      <div v-if="showProjectsPagination" class="mt-4 flex justify-end">
        <n-pagination
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :item-count="tag?.projectsTotal ?? 0"
          show-size-picker
          :page-sizes="[10, 20, 30, 50]"
          size="small"
          :disabled="isLoadingProjects"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </n-card>
  </div>
</template>
