import { computed, type ComputedRef } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  listProjectLanguages,
  triggerProjectSummary,
  type ProjectListQuery,
} from '../api/projects'
import type {
  ProjectSummary,
  ProjectUpdatePayload,
  ProjectAiSummaryOptions,
  ProjectAiSummaryResult,
} from '../types/project'
import type { PaginatedResponse } from '../api/types'
import { useMessage } from '../utils/feedback'

function normalizeProjectFilters(filters: ProjectListQuery) {
  return {
    ...filters,
    tagNames: filters.tagNames?.length ? [...filters.tagNames].sort() : undefined,
    languages: filters.languages?.length ? [...filters.languages].sort() : undefined,
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

export function useProjectLanguagesQuery() {
  return useQuery({
    queryKey: ['project-languages'],
    queryFn: () => listProjectLanguages(),
    staleTime: 1000 * 60 * 5,
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

export function useProjectDeleteMutation() {
  const queryClient = useQueryClient()
  const message = useMessage()

  return useMutation<void, unknown, string>({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      message.success('项目已删除')
      queryClient.removeQueries({ queryKey: ['project-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => {
      const msg = (error as Error | undefined)?.message ?? '删除失败'
      message.error(msg)
    },
  })
}

interface ProjectSummaryTriggerVariables {
  id: string
  options?: ProjectAiSummaryOptions
}

export function useProjectSummaryMutation() {
  const queryClient = useQueryClient()
  const message = useMessage()

  return useMutation<ProjectAiSummaryResult, unknown, ProjectSummaryTriggerVariables>({
    mutationFn: ({ id, options }) => triggerProjectSummary(id, options),
    onSuccess: (result, variables) => {
      message.success('AI 摘要已生成')

      queryClient.setQueryData<ProjectSummary | undefined>(
        ['project-detail', variables.id],
        (existing) => {
          if (!existing) return existing
          const next: ProjectSummary = { ...existing }
          if (result.summaryShort !== undefined) {
            next.summaryShort = result.summaryShort ?? null
          }
          if (result.summaryLong !== undefined) {
            next.summaryLong = result.summaryLong ?? null
          }
          return next
        }
      )

      queryClient.setQueriesData<PaginatedResponse<ProjectSummary[]> | undefined>(
        { queryKey: ['projects'] },
        (cached) => {
          if (!cached) return cached
          return {
            ...cached,
            data: cached.data.map((entry) => {
              if (entry.id !== variables.id) return entry
              const next: ProjectSummary = { ...entry }
              if (result.summaryShort !== undefined) {
                next.summaryShort = result.summaryShort ?? null
              }
              if (result.summaryLong !== undefined) {
                next.summaryLong = result.summaryLong ?? null
              }
              return next
            }),
          }
        }
      )
    },
    onError: (error) => {
      const msg = (error as Error | undefined)?.message ?? '触发 AI 摘要失败'
      message.error(msg)
    },
  })
}
