import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ProjectSummary } from '../../types/project'
import type { PaginatedResponse } from '../../api/types'
import {
  listProjects,
  listProjectLanguages,
  getProject,
  updateProject,
  deleteProject,
  triggerProjectSummary,
} from '../../api/projects'

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

const baseProject: ProjectSummary = {
  id: '1',
  githubId: 100,
  name: 'demo',
  fullName: 'demo/repo',
  url: 'https://example.com/demo',
  description: '示例项目',
  language: 'TypeScript',
  stars: 10,
  forks: 1,
  lastCommit: '2024-01-20T00:00:00.000Z',
  lastSyncAt: '2024-01-21T00:00:00.000Z',
  touchedAt: null,
  notes: null,
  favorite: false,
  archived: false,
  pinned: false,
  score: null,
  summaryShort: '概览',
  summaryLong: '详细说明',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-21T00:00:00.000Z',
  deletedAt: null,
  tags: [],
  videoLinks: [],
}

describe('projects api service', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
  })

  it('builds search params and normalizes project list responses', async () => {
    const rawProject: ProjectSummary = {
      ...baseProject,
      summaryShort: '\u0000简要\u0008',
      summaryLong: '长描述\u0001',
      tags: [
        { id: 't1', name: '标签\u0002A ', description: ' 描述\u0003' },
        { id: 't2', name: ' 标签B', description: null },
      ],
      videoLinks: [' https://video.example.com/demo \u0007'],
    }
    const paginated: PaginatedResponse<ProjectSummary[]> = {
      message: 'ok',
      data: [rawProject],
      page: 2,
      pageSize: 50,
      total: 120,
    }
    getMock.mockResolvedValue({
      data: JSON.stringify(paginated),
    })

    const result = await listProjects({
      page: 2,
      pageSize: 50,
      keyword: 'cli',
      language: 'TypeScript',
      languages: ['Go', 'TypeScript'],
      favorite: true,
      pinned: false,
      archived: false,
      tagNames: ['tag-b', 'tag-a'],
      starsMin: 20,
      starsMax: 100,
      forksMin: 10,
      forksMax: 40,
      createdAtStart: '2023-01-01T00:00:00.000Z',
      createdAtEnd: '2023-12-31T23:59:59.000Z',
      updatedAtStart: '2024-01-01T00:00:00.000Z',
      updatedAtEnd: '2024-01-31T23:59:59.000Z',
      lastCommitStart: '2024-01-01T00:00:00.000Z',
      lastCommitEnd: '2024-02-01T00:00:00.000Z',
      sort: 'stars:desc',
      extra: ['value-a', 'value-b'],
    } as unknown as Parameters<typeof listProjects>[0])

    expect(getMock).toHaveBeenCalledTimes(1)
    const [, config] = getMock.mock.calls[0]
    expect(config?.params).toBeInstanceOf(URLSearchParams)
    const params = config?.params as URLSearchParams
    expect(params.get('page')).toBe('2')
    expect(params.get('pageSize')).toBe('50')
    expect(params.get('keyword')).toBe('cli')
    expect(params.getAll('languages')).toEqual(['Go', 'TypeScript'])
    expect(params.get('language')).toBeNull()
    expect(params.get('favorite')).toBe('true')
    expect(params.get('pinned')).toBe('false')
    expect(params.get('archived')).toBe('false')
    expect(params.getAll('tagNames')).toEqual(['tag-b', 'tag-a'])
    expect(params.get('starsMin')).toBe('20')
    expect(params.get('starsMax')).toBe('100')
    expect(params.get('forksMin')).toBe('10')
    expect(params.get('forksMax')).toBe('40')
    expect(params.get('createdAtStart')).toBe('2023-01-01T00:00:00.000Z')
    expect(params.get('createdAtEnd')).toBe('2023-12-31T23:59:59.000Z')
    expect(params.get('updatedAtStart')).toBe('2024-01-01T00:00:00.000Z')
    expect(params.get('updatedAtEnd')).toBe('2024-01-31T23:59:59.000Z')
    expect(params.get('lastCommitStart')).toBe('2024-01-01T00:00:00.000Z')
    expect(params.get('lastCommitEnd')).toBe('2024-02-01T00:00:00.000Z')
    expect(params.get('orderBy')).toBe('stars')
    expect(params.get('orderDirection')).toBe('desc')
    expect(params.getAll('extra')).toEqual(['value-a', 'value-b'])

    expect(result.page).toBe(2)
    expect(result.data).toHaveLength(1)
    const project = result.data[0]
    expect(project.summaryShort).toBe('简要')
    expect(project.summaryLong).toBe('长描述')
    expect(project.tags).toEqual([
      { id: 't1', name: '标签 A', description: '描述' },
      { id: 't2', name: '标签B', description: null },
    ])
    expect(project.videoLinks).toEqual(['https://video.example.com/demo'])
  })

  it('normalizes list responses returned as JSON string', async () => {
    const payload = {
      data: [
        {
          ...baseProject,
          summaryShort: '  ',
          tags: [{ id: '1', name: ' Tag ', description: ' ' }],
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    }
    getMock.mockResolvedValue({
      data: JSON.stringify(payload),
    })

    const result = await listProjects({ page: 1 })

    expect(result.data[0]?.summaryShort).toBeNull()
    expect(result.data[0]?.tags[0]?.name).toBe('Tag')
    expect(result.data[0]?.tags[0]?.description).toBeNull()
  })

  it('returns sanitized language list', async () => {
    getMock.mockResolvedValue({
      data: JSON.stringify({ data: [' JavaScript ', '\u0001TypeScript\u0002'] }),
    })

    const languages = await listProjectLanguages()

    expect(getMock).toHaveBeenCalledWith('/projects/languages')
    expect(languages).toEqual(['JavaScript', 'TypeScript'])
  })

  it('gets and normalizes project detail', async () => {
    getMock.mockResolvedValue({
      data: JSON.stringify({
        message: 'ok',
        data: { ...baseProject, summaryLong: ' 长文 ' },
      }),
    })

    const project = await getProject('42')

    expect(getMock).toHaveBeenCalledWith('/projects/42')
    expect(project.summaryLong).toBe('长文')
  })

  it('updates project and normalizes response', async () => {
    putMock.mockResolvedValue({
      data: JSON.stringify({
        message: 'ok',
        data: { ...baseProject, favorite: true, summaryShort: ' 新摘要 ' },
      }),
    })

    const project = await updateProject('2', { favorite: true })

    expect(putMock).toHaveBeenCalledWith('/projects/2', { favorite: true })
    expect(project.favorite).toBe(true)
    expect(project.summaryShort).toBe('新摘要')
  })

  it('deletes project by id', async () => {
    deleteMock.mockResolvedValue(undefined)

    await deleteProject('13')

    expect(deleteMock).toHaveBeenCalledWith('/projects/13')
  })

  it('triggers AI summary generation', async () => {
    const summary = { summaryShort: '概览', summaryLong: '长摘要' }
    postMock.mockResolvedValue({
      data: JSON.stringify({ message: 'ok', data: summary }),
    })

    const result = await triggerProjectSummary('1', { lang: 'zh' })

    expect(postMock).toHaveBeenCalledWith('/ai/projects/1/summary', { lang: 'zh' })
    expect(result).toEqual(summary)
  })
})
