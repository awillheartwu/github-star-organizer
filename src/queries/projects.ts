import { computed, type ComputedRef } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { listProjects, getProject, updateProject, type ProjectListQuery } from '../api/projects'
import type { ProjectSummary, ProjectUpdatePayload } from '../types/project'
import type { PaginatedResponse } from '../api/types'
import { useMessage } from '../utils/feedback'

function normalizeProjectFilters(filters: ProjectListQuery) {
  return {
    ...filters,
    tagNames: filters.tagNames ? [...filters.tagNames].sort() : undefined,
  }
}

export function useProjectsQuery(filters: ComputedRef<ProjectListQuery>) {
  return useQuery({
    queryKey: computed(() => ['projects', normalizeProjectFilters(filters.value)]),
    queryFn: () => listProjects(filters.value),
    placeholderData: keepPreviousData,
  })
}

export function useProjectDetailQuery(projectId: ComputedRef<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['project-detail', projectId.value]),
    enabled: computed(() => Boolean(projectId.value)),
    queryFn: () => getProject(projectId.value as string),
  })
}

interface ProjectUpdateVariables {
  id: string
  payload: ProjectUpdatePayload
  successMessage?: string
}

export function useProjectUpdateMutation() {
  const queryClient = useQueryClient()
  const message = useMessage()

  return useMutation<ProjectSummary, unknown, ProjectUpdateVariables>({
    mutationFn: ({ id, payload }) => updateProject(id, payload),
    onSuccess: (updated, variables) => {
      const notice = variables.successMessage ?? '项目已更新'
      message.success(notice)

      queryClient.setQueryData(['project-detail', variables.id], updated)

      queryClient.setQueriesData<PaginatedResponse<ProjectSummary[]> | undefined>(
        { queryKey: ['projects'] },
        (cached) => {
          if (!cached) return cached
          return {
            ...cached,
            data: cached.data.map((entry) => (entry.id === updated.id ? updated : entry)),
          }
        }
      )
    },
    onError: (error) => {
      const msg = (error as Error | undefined)?.message ?? '操作失败'
      message.error(msg)
    },
  })
}
