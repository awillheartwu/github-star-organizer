import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, computed, ref } from 'vue'
import { render, waitFor } from '@testing-library/vue'
import { QueryClient, VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { ProjectSummary, ProjectAiSummaryResult } from '../../types/project'
import type { PaginatedResponse } from '../../api/types'
import type { ProjectListQuery } from '../../api/projects'
import {
  useProjectsQuery,
  useProjectUpdateMutation,
  useProjectDeleteMutation,
  useProjectSummaryMutation,
} from '../../queries/projects'

const listProjectsMock = vi.fn()
const getProjectMock = vi.fn()
const updateProjectMock = vi.fn()
const deleteProjectMock = vi.fn()
const listProjectLanguagesMock = vi.fn()
const triggerProjectSummaryMock = vi.fn()

vi.mock('../../api/projects', () => ({
  listProjects: (...args: unknown[]) => listProjectsMock(...args),
  getProject: (...args: unknown[]) => getProjectMock(...args),
  updateProject: (...args: unknown[]) => updateProjectMock(...args),
  deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
  listProjectLanguages: (...args: unknown[]) => listProjectLanguagesMock(...args),
  triggerProjectSummary: (...args: unknown[]) => triggerProjectSummaryMock(...args),
}))

const messageMock = {
  success: vi.fn(),
  error: vi.fn(),
}

vi.mock('../../utils/feedback', () => ({
  useMessage: () => messageMock,
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderWithQueryClient(
  component: ReturnType<typeof defineComponent>,
  queryClient: QueryClient
) {
  const plugin: [typeof VueQueryPlugin, VueQueryPluginOptions] = [VueQueryPlugin, { queryClient }]
  return render(component, {
    global: {
      plugins: [plugin],
    },
  })
}

function createProject(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'p1',
    githubId: 100,
    name: 'demo',
    fullName: 'demo/repo',
    url: 'https://example.com/demo',
    description: 'desc',
    language: 'TypeScript',
    stars: 1,
    forks: 0,
    lastCommit: null,
    lastSyncAt: '2024-01-01T00:00:00.000Z',
    touchedAt: null,
    notes: null,
    favorite: false,
    archived: false,
    pinned: false,
    score: null,
    summaryShort: null,
    summaryLong: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    tags: [],
    videoLinks: [],
    ...overrides,
  }
}

describe('projects queries', () => {
  beforeEach(() => {
    listProjectsMock.mockReset()
    getProjectMock.mockReset()
    updateProjectMock.mockReset()
    deleteProjectMock.mockReset()
    listProjectLanguagesMock.mockReset()
    triggerProjectSummaryMock.mockReset()
    messageMock.success.mockReset()
    messageMock.error.mockReset()
  })

  it('uses sorted filters in query key and fetches project list', async () => {
    const queryClient = createQueryClient()
    const listResponse: PaginatedResponse<ProjectSummary[]> = {
      message: 'ok',
      data: [createProject({ id: 'p2' })],
      page: 1,
      pageSize: 20,
      total: 1,
    }
    listProjectsMock.mockResolvedValue(listResponse)

    const filtersRef = ref<ProjectListQuery>({
      page: 1,
      tagNames: ['beta', 'alpha'],
      languages: ['Rust', 'Go'],
      starsMin: undefined,
      starsMax: 10,
    })

    let queryResult: ReturnType<typeof useProjectsQuery>
    const TestComponent = defineComponent({
      setup() {
        const computedFilters = computed(() => filtersRef.value)
        queryResult = useProjectsQuery(computedFilters)
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await waitFor(() => expect(queryResult!.isSuccess.value).toBe(true))

    expect(listProjectsMock).toHaveBeenCalledWith(filtersRef.value)
    const queries = queryClient.getQueryCache().findAll({ queryKey: ['projects'] })
    expect(queries).toHaveLength(1)
    const queryKey = queries[0]?.queryKey as [string, Record<string, unknown>]
    const normalized = queryKey[1] as Record<string, unknown>
    expect(normalized.tagNames).toEqual(['alpha', 'beta'])
    expect(normalized.languages).toEqual(['Go', 'Rust'])
    expect(normalized.starsMin).toBeUndefined()
    expect(normalized.starsMax).toBe(10)
    expect(queryResult!.data.value).toEqual(listResponse)

    unmount()
  })

  it('updates cache and shows success message after project mutation', async () => {
    const queryClient = createQueryClient()
    const existing = createProject({ id: 'p1', favorite: false })
    const updated = createProject({ id: 'p1', favorite: true, summaryShort: 'new' })
    updateProjectMock.mockResolvedValue(updated)

    const cachedList: PaginatedResponse<ProjectSummary[]> = {
      message: 'ok',
      data: [existing],
      page: 1,
      pageSize: 20,
      total: 1,
    }
    queryClient.setQueryData(['project-detail', 'p1'], existing)
    queryClient.setQueryData(['projects', { page: 1 }], cachedList)

    let mutation: ReturnType<typeof useProjectUpdateMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectUpdateMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await mutation!.mutateAsync({ id: 'p1', payload: { favorite: true }, successMessage: '已更新' })

    expect(updateProjectMock).toHaveBeenCalledWith('p1', { favorite: true })
    expect(messageMock.success).toHaveBeenCalledWith('已更新')
    expect(queryClient.getQueryData(['project-detail', 'p1'])).toEqual(updated)
    const listData = queryClient.getQueryData(['projects', { page: 1 }]) as PaginatedResponse<
      ProjectSummary[]
    >
    expect(listData.data[0]).toEqual(updated)

    unmount()
  })

  it('reports error when project update fails', async () => {
    const queryClient = createQueryClient()
    const error = new Error('失败')
    updateProjectMock.mockRejectedValue(error)

    let mutation: ReturnType<typeof useProjectUpdateMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectUpdateMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await expect(mutation!.mutateAsync({ id: 'p9', payload: { favorite: true } })).rejects.toThrow(
      '失败'
    )
    expect(messageMock.error).toHaveBeenCalledWith('失败')

    unmount()
  })

  it('invalidates relevant caches when project is deleted', async () => {
    const queryClient = createQueryClient()
    deleteProjectMock.mockResolvedValue(undefined)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')

    let mutation: ReturnType<typeof useProjectDeleteMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectDeleteMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await mutation!.mutateAsync('p3')

    expect(deleteProjectMock).toHaveBeenCalledWith('p3')
    expect(messageMock.success).toHaveBeenCalledWith('项目已删除')
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['project-detail', 'p3'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects'] })

    unmount()
  })

  it('notifies error when project deletion fails', async () => {
    const queryClient = createQueryClient()
    deleteProjectMock.mockRejectedValue(new Error('删除失败'))

    let mutation: ReturnType<typeof useProjectDeleteMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectDeleteMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await expect(mutation!.mutateAsync('p4')).rejects.toThrow('删除失败')
    expect(messageMock.error).toHaveBeenCalledWith('删除失败')

    unmount()
  })

  it('updates summaries in caches after AI summary mutation', async () => {
    const queryClient = createQueryClient()
    const existing = createProject({ id: 'p7', summaryShort: null, summaryLong: null })
    const listEntry = createProject({ id: 'p7', summaryShort: null, summaryLong: null })
    const summaryResult: ProjectAiSummaryResult = {
      summaryShort: '短摘要',
      tagsCreated: [],
      tagsLinked: [],
    }
    triggerProjectSummaryMock.mockResolvedValue(summaryResult)

    queryClient.setQueryData(['project-detail', 'p7'], existing)
    queryClient.setQueryData(['projects', { page: 1 }], {
      message: 'ok',
      data: [listEntry],
      page: 1,
      pageSize: 20,
      total: 1,
    } as PaginatedResponse<ProjectSummary[]>)

    let mutation: ReturnType<typeof useProjectSummaryMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectSummaryMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await mutation!.mutateAsync({ id: 'p7', options: { lang: 'zh' } })

    expect(triggerProjectSummaryMock).toHaveBeenCalledWith('p7', { lang: 'zh' })
    expect(messageMock.success).toHaveBeenCalledWith('AI 摘要已生成')

    const detail = queryClient.getQueryData(['project-detail', 'p7']) as ProjectSummary
    expect(detail.summaryShort).toBe('短摘要')
    expect(detail.summaryLong).toBeNull()

    const listCache = queryClient.getQueryData(['projects', { page: 1 }]) as PaginatedResponse<
      ProjectSummary[]
    >
    expect(listCache.data[0]?.summaryShort).toBe('短摘要')
    expect(listCache.data[0]?.summaryLong).toBeNull()

    unmount()
  })

  it('reports error when AI summary mutation fails', async () => {
    const queryClient = createQueryClient()
    triggerProjectSummaryMock.mockRejectedValue(new Error('失败'))

    let mutation: ReturnType<typeof useProjectSummaryMutation>
    const TestComponent = defineComponent({
      setup() {
        mutation = useProjectSummaryMutation()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await expect(mutation!.mutateAsync({ id: 'p7' })).rejects.toThrow('失败')
    expect(messageMock.error).toHaveBeenCalledWith('失败')

    unmount()
  })
})
