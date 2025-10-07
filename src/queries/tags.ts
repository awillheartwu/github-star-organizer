import { computed, type ComputedRef } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  type TagListQuery,
  type TagDetailQuery,
} from '../api/tags'
import type { TagPayload } from '../types/tag'
import { useMessage } from '../utils/feedback'

export function useTagListQuery(filters: ComputedRef<TagListQuery>) {
  return useQuery({
    queryKey: computed(() => ['tags', filters.value]),
    queryFn: () => listTags(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useTagDetailQuery(tagParams: ComputedRef<{ id?: string } & TagDetailQuery>) {
  return useQuery({
    queryKey: computed(() => [
      'tag-detail',
      tagParams.value.id,
      tagParams.value.projectsPage ?? 1,
      tagParams.value.projectsPageSize ?? 20,
    ]),
    enabled: computed(() => Boolean(tagParams.value.id)),
    queryFn: () =>
      getTag(tagParams.value.id as string, {
        projectsPage: tagParams.value.projectsPage,
        projectsPageSize: tagParams.value.projectsPageSize,
      }),
  })
}

export function useTagMutations() {
  const queryClient = useQueryClient()
  const message = useMessage()

  const handleError = (error: unknown) => {
    const msg = (error as Error | undefined)?.message ?? '操作失败'
    message.error(msg)
  }

  const createMutation = useMutation({
    mutationFn: (payload: TagPayload) => createTag(payload),
    onSuccess: () => {
      message.success('标签已创建')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TagPayload> }) => updateTag(id, payload),
    onSuccess: (_, variables) => {
      message.success('标签已更新')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['tag-detail', variables.id] })
    },
    onError: handleError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: (_, id) => {
      message.success('标签已删除')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.removeQueries({ queryKey: ['tag-detail', id] })
    },
    onError: handleError,
  })

  return { createMutation, updateMutation, deleteMutation }
}
