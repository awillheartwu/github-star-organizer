import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { TagDetail, TagListItem } from '../../types/tag'
import { listTags, getTag, createTag, updateTag, deleteTag } from '../../api/tags'

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('../../api/http', () => ({
  api: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  },
}))

const listResponse = {
  data: [
    {
      id: '1',
      name: 'tag-a',
      description: null,
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      projectCount: 0,
    },
  ] satisfies TagListItem[],
  page: 1,
  pageSize: 20,
  total: 1,
}

describe('tags api service', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
  })

  it('builds list query params correctly', async () => {
    getMock.mockResolvedValue({ data: listResponse })

    const filters = {
      page: 2,
      pageSize: 50,
      archived: false,
      keyword: 'tag',
      sort: 'createdAt:asc',
    }
    const result = await listTags(filters)

    expect(getMock).toHaveBeenCalledWith('/tags', {
      params: {
        page: 2,
        pageSize: 50,
        archived: false,
        keyword: 'tag',
        orderBy: 'createdAt',
        orderDirection: 'asc',
      },
    })
    expect(result).toEqual(listResponse)
  })

  it('requests tag detail with optional pagination', async () => {
    const detail: TagDetail = {
      id: '1',
      name: 'tag-a',
      description: null,
      archived: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-10T00:00:00.000Z',
      projects: [],
      projectsTotal: 0,
      projectsPage: 1,
      projectsPageSize: 20,
    }
    getMock.mockResolvedValue({
      data: { message: 'ok', data: detail },
    })

    const tag = await getTag('1', { projectsPage: 3, projectsPageSize: 40 })

    expect(getMock).toHaveBeenCalledWith('/tags/1', {
      params: { projectsPage: 3, projectsPageSize: 40 },
    })
    expect(tag).toEqual(detail)
  })

  it('creates tag and returns detail', async () => {
    const detail = { ...listResponse.data[0], archived: false } as unknown as TagDetail
    postMock.mockResolvedValue({ data: { message: 'ok', data: detail } })

    const created = await createTag({ name: 'tag-a', description: null })

    expect(postMock).toHaveBeenCalledWith('/tags', {
      name: 'tag-a',
      description: null,
    })
    expect(created).toEqual(detail)
  })

  it('updates tag and returns detail', async () => {
    const detail = { ...listResponse.data[0], archived: true } as unknown as TagDetail
    putMock.mockResolvedValue({ data: { message: 'ok', data: detail } })

    const updated = await updateTag('5', { description: 'new' })

    expect(putMock).toHaveBeenCalledWith('/tags/5', { description: 'new' })
    expect(updated).toEqual(detail)
  })

  it('deletes tag by id', async () => {
    deleteMock.mockResolvedValue(undefined)

    await deleteTag('9')

    expect(deleteMock).toHaveBeenCalledWith('/tags/9')
  })
})
