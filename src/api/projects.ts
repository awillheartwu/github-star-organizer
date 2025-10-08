import { api } from './http'
import type { ApiResponse, PaginatedResponse } from './types'
import type {
  ProjectSummary,
  ProjectFilters,
  ProjectUpdatePayload,
  ProjectAiSummaryOptions,
  ProjectAiSummaryResult,
} from '../types/project'

export interface ProjectListQuery extends ProjectFilters {
  page?: number
  pageSize?: number
  languages?: string[]
  archived?: boolean
  starsMin?: number
  starsMax?: number
  forksMin?: number
  forksMax?: number
  createdAtStart?: string
  createdAtEnd?: string
  updatedAtStart?: string
  updatedAtEnd?: string
  lastCommitStart?: string
  lastCommitEnd?: string
}

const CONTROL_CHAR_PATTERN = /[\u0000-\u001f\u007f]/g

function safeParseJson<T>(input: string): T {
  try {
    return JSON.parse(input) as T
  } catch (_error) {
    const sanitized = input.replace(CONTROL_CHAR_PATTERN, ' ')
    return JSON.parse(sanitized) as T
  }
}

function normalizePayload<T>(payload: T | string): T {
  if (typeof payload === 'string') {
    return safeParseJson<T>(payload)
  }
  return payload
}

function normalizeProjectSummary(project: ProjectSummary | string): ProjectSummary {
  const normalized = normalizePayload<ProjectSummary>(project)
  const cleaned: ProjectSummary = { ...normalized }
  if (typeof cleaned.summaryShort === 'string') {
    const value = cleaned.summaryShort.replace(CONTROL_CHAR_PATTERN, ' ').trim()
    cleaned.summaryShort = value ? value : null
  }
  if (typeof cleaned.summaryLong === 'string') {
    const value = cleaned.summaryLong.replace(CONTROL_CHAR_PATTERN, ' ').trim()
    cleaned.summaryLong = value ? value : null
  }
  if (Array.isArray(cleaned.tags)) {
    cleaned.tags = cleaned.tags.map((tag) => ({
      ...tag,
      name:
        typeof tag.name === 'string'
          ? tag.name.replace(CONTROL_CHAR_PATTERN, ' ').trim()
          : tag.name,
      description:
        typeof tag.description === 'string'
          ? tag.description.replace(CONTROL_CHAR_PATTERN, ' ').trim() || null
          : (tag.description ?? null),
    }))
  }
  if (Array.isArray(cleaned.videoLinks)) {
    cleaned.videoLinks = cleaned.videoLinks.map((link) =>
      typeof link === 'string' ? link.replace(CONTROL_CHAR_PATTERN, ' ').trim() : link
    )
  }
  return cleaned
}

function buildQueryParams(query: ProjectListQuery) {
  const {
    sort,
    keyword,
    language,
    languages,
    favorite,
    pinned,
    tagNames,
    page,
    pageSize,
    archived,
    starsMin,
    starsMax,
    forksMin,
    forksMax,
    createdAtStart,
    createdAtEnd,
    updatedAtStart,
    updatedAtEnd,
    lastCommitStart,
    lastCommitEnd,
    ...rest
  } = query

  const searchParams = new URLSearchParams()
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) return
    searchParams.append(key, String(value))
  }

  append('page', page)
  append('pageSize', pageSize)
  append('keyword', keyword)

  if (!languages?.length && language) {
    append('language', language)
  }

  if (languages?.length) {
    for (const lang of languages) {
      append('languages', lang)
    }
  }

  if (favorite !== undefined) append('favorite', favorite)
  if (pinned !== undefined) append('pinned', pinned)
  if (archived !== undefined) append('archived', archived)

  if (tagNames?.length) {
    for (const tag of tagNames) {
      append('tagNames', tag)
    }
  }

  append('starsMin', starsMin)
  append('starsMax', starsMax)
  append('forksMin', forksMin)
  append('forksMax', forksMax)
  append('createdAtStart', createdAtStart)
  append('createdAtEnd', createdAtEnd)
  append('updatedAtStart', updatedAtStart)
  append('updatedAtEnd', updatedAtEnd)
  append('lastCommitStart', lastCommitStart)
  append('lastCommitEnd', lastCommitEnd)

  Object.entries(rest).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      for (const item of value) {
        append(key, item)
      }
    } else {
      append(key, value)
    }
  })

  if (sort) {
    const [orderBy = '', orderDirection = 'asc'] = sort.split(':')
    if (orderBy) {
      append('orderBy', orderBy)
      append('orderDirection', orderDirection)
    }
  }

  return searchParams
}

export async function listProjects(query: ProjectListQuery) {
  const params = buildQueryParams(query)
  const response = await api.get<PaginatedResponse<ProjectSummary[]> | string>('/projects', {
    params,
  })
  const payload = normalizePayload<PaginatedResponse<ProjectSummary[]>>(response.data)
  return {
    ...payload,
    data: payload.data.map((project) => normalizeProjectSummary(project)),
  }
}

export async function listProjectLanguages() {
  const response = await api.get<ApiResponse<string[]> | string>('/projects/languages')
  const payload = normalizePayload<ApiResponse<string[]>>(response.data)
  if (Array.isArray(payload.data)) {
    return payload.data.map((item) =>
      typeof item === 'string' ? item.replace(CONTROL_CHAR_PATTERN, ' ').trim() : item
    )
  }
  return []
}

export async function getProject(id: string) {
  const response = await api.get<{ message: string; data: ProjectSummary } | string>(
    `/projects/${id}`
  )
  const payload = normalizePayload<{ message: string; data: ProjectSummary }>(response.data)
  return normalizeProjectSummary(payload.data)
}

export async function updateProject(id: string, payload: ProjectUpdatePayload) {
  const response = await api.put<{ message: string; data: ProjectSummary } | string>(
    `/projects/${id}`,
    payload
  )
  const parsed = normalizePayload<{ message: string; data: ProjectSummary }>(response.data)
  return normalizeProjectSummary(parsed.data)
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`)
}

export async function triggerProjectSummary(id: string, options: ProjectAiSummaryOptions = {}) {
  const response = await api.post<{ message: string; data: ProjectAiSummaryResult } | string>(
    `/ai/projects/${id}/summary`,
    options
  )
  const payload = normalizePayload<{ message: string; data: ProjectAiSummaryResult }>(response.data)
  return payload.data
}
