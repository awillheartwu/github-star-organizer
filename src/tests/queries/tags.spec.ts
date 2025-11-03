import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, computed, ref } from 'vue'
import { render, waitFor } from '@testing-library/vue'
import { QueryClient, VueQueryPlugin, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { PaginatedResponse } from '../../api/types'
import type { TagListItem, TagDetail, TagPayload } from '../../types/tag'
import { useTagListQuery, useTagMutations } from '../../queries/tags'

const listTagsMock = vi.fn()
const getTagMock = vi.fn()
const createTagMock = vi.fn()
const updateTagMock = vi.fn()
const deleteTagMock = vi.fn()

vi.mock('../../api/tags', () => ({
  listTags: (...args: unknown[]) => listTagsMock(...args),
  getTag: (...args: unknown[]) => getTagMock(...args),
  createTag: (...args: unknown[]) => createTagMock(...args),
  updateTag: (...args: unknown[]) => updateTagMock(...args),
  deleteTag: (...args: unknown[]) => deleteTagMock(...args),
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

describe('tags queries', () => {
  beforeEach(() => {
    listTagsMock.mockReset()
    getTagMock.mockReset()
    createTagMock.mockReset()
    updateTagMock.mockReset()
    deleteTagMock.mockReset()
    messageMock.success.mockReset()
    messageMock.error.mockReset()
  })

  it('fetches tag list with provided filters', async () => {
    const queryClient = createQueryClient()
    const response: PaginatedResponse<TagListItem[]> = {
      message: 'ok',
      data: [
        {
          id: '1',
          name: 'tag-a',
          description: null,
          archived: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    }
    listTagsMock.mockResolvedValue(response)

    const filtersRef = ref({
      page: 2,
      pageSize: 50,
      archived: false,
      keyword: 'tag',
      sort: 'createdAt:desc',
    })

    let queryResult: ReturnType<typeof useTagListQuery>
    const TestComponent = defineComponent({
      setup() {
        const computedFilters = computed(() => filtersRef.value)
        queryResult = useTagListQuery(computedFilters)
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await waitFor(() => expect(queryResult!.isSuccess.value).toBe(true))

    expect(listTagsMock).toHaveBeenCalledWith(filtersRef.value)
    const queries = queryClient.getQueryCache().findAll({ queryKey: ['tags'] })
    expect(queries).toHaveLength(1)
    const queryKey = queries[0]?.queryKey as [string, Record<string, unknown>]
    expect(queryKey[1]).toEqual(filtersRef.value)
    expect(queryResult!.data.value).toEqual(response)

    unmount()
  })

  it('invalidates tag list after create mutation', async () => {
    const queryClient = createQueryClient()
    createTagMock.mockResolvedValue({
      id: '1',
      name: 'tag-a',
      description: null,
      archived: false,
      createdAt: '',
      updatedAt: '',
      projects: [],
      projectsTotal: 0,
      projectsPage: 1,
      projectsPageSize: 20,
    } satisfies TagDetail)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    let mutations: ReturnType<typeof useTagMutations>
    const TestComponent = defineComponent({
      setup() {
        mutations = useTagMutations()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    const payload: TagPayload = { name: 'tag-a', description: null }
    await mutations!.createMutation.mutateAsync(payload)

    expect(createTagMock).toHaveBeenCalledWith(payload)
    expect(messageMock.success).toHaveBeenCalledWith('标签已创建')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tags'] })

    unmount()
  })

  it('invalidates tag list and detail after update mutation', async () => {
    const queryClient = createQueryClient()
    updateTagMock.mockResolvedValue({
      id: '1',
      name: 'tag-a',
      description: 'updated',
      archived: false,
      createdAt: '',
      updatedAt: '',
      projects: [],
      projectsTotal: 0,
      projectsPage: 1,
      projectsPageSize: 20,
    } satisfies TagDetail)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    let mutations: ReturnType<typeof useTagMutations>
    const TestComponent = defineComponent({
      setup() {
        mutations = useTagMutations()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await mutations!.updateMutation.mutateAsync({ id: '1', payload: { description: 'updated' } })

    expect(updateTagMock).toHaveBeenCalledWith('1', { description: 'updated' })
    expect(messageMock.success).toHaveBeenCalledWith('标签已更新')
    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: ['tags'] })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: ['tag-detail', '1'] })

    unmount()
  })

  it('removes tag detail cache after delete mutation', async () => {
    const queryClient = createQueryClient()
    deleteTagMock.mockResolvedValue(undefined)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')

    let mutations: ReturnType<typeof useTagMutations>
    const TestComponent = defineComponent({
      setup() {
        mutations = useTagMutations()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await mutations!.deleteMutation.mutateAsync('3')

    expect(deleteTagMock).toHaveBeenCalledWith('3')
    expect(messageMock.success).toHaveBeenCalledWith('标签已删除')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tags'] })
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['tag-detail', '3'] })

    unmount()
  })

  it('reports error when create mutation fails', async () => {
    const queryClient = createQueryClient()
    createTagMock.mockRejectedValue(new Error('失败'))

    let mutations: ReturnType<typeof useTagMutations>
    const TestComponent = defineComponent({
      setup() {
        mutations = useTagMutations()
        return () => null
      },
    })

    const { unmount } = renderWithQueryClient(TestComponent, queryClient)

    await expect(
      mutations!.createMutation.mutateAsync({ name: 'tag', description: null })
    ).rejects.toThrow('失败')
    expect(messageMock.error).toHaveBeenCalledWith('失败')

    unmount()
  })
})
