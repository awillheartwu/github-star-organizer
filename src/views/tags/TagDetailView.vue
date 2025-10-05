<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NDescriptions, NDescriptionsItem, NList, NListItem, NSpace, NTag } from 'naive-ui'
import { formatDate } from '../../utils/format'
import { useTagDetailQuery } from '../../queries/tags'

const route = useRoute()
const router = useRouter()

const tagId = computed(() => route.params.id as string)

const tagQuery = useTagDetailQuery(tagId)

const tag = computed(() => tagQuery.data.value)
</script>

<template>
  <div class="flex flex-col gap-4">
    <n-alert v-if="tagQuery.isError.value" type="error" show-icon>
      加载标签信息失败，请稍后重试。
    </n-alert>

    <n-card v-if="tag" size="large" :bordered="false" class="shadow-sm">
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
            <n-button tertiary disabled>编辑</n-button>
            <n-button tertiary @click="router.push({ name: 'tags' })">返回列表</n-button>
          </n-space>
        </div>

        <n-descriptions :column="1" size="small">
          <n-descriptions-item label="创建于">{{ formatDate(tag.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="更新于">{{ formatDate(tag.updatedAt) }}</n-descriptions-item>
          <n-descriptions-item label="标签 ID">{{ tag.id }}</n-descriptions-item>
        </n-descriptions>
      </div>
    </n-card>

    <n-card title="相关项目" size="small">
      <n-list bordered :show-divider="false">
        <template v-if="tag?.projects?.length">
          <n-list-item v-for="project in tag.projects" :key="project.id">
            <div class="flex flex-col">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-900">{{ project.fullName ?? project.name }}</span>
                <n-button
                  size="tiny"
                  quaternary
                  @click="router.push({ name: 'project-detail', params: { id: project.id } })"
                >
                  查看详情
                </n-button>
              </div>
              <a v-if="project.url" :href="project.url" target="_blank" rel="noreferrer" class="text-xs text-primary-500">
                {{ project.url }}
              </a>
            </div>
          </n-list-item>
        </template>
        <n-list-item v-else>
          <span class="text-sm text-slate-500">No Data</span>
        </n-list-item>
      </n-list>
    </n-card>
  </div>
</template>
