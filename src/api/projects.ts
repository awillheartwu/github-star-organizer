import { api } from './http'
import type { ApiResponse, PaginatedResponse } from './types'
import type { ProjectSummary, ProjectFilters, ProjectUpdatePayload } from '../types/project'

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
  const { data } = await api.get<PaginatedResponse<ProjectSummary[]>>('/projects', { params })
  return data
}

export async function listProjectLanguages() {
  const { data } = await api.get<ApiResponse<string[]>>('/projects/languages')
  return data.data
}

export async function getProject(id: string) {
  const { data } = await api.get<{ message: string; data: ProjectSummary }>(`/projects/${id}`)
  return data.data
}

export async function updateProject(id: string, payload: ProjectUpdatePayload) {
  const { data } = await api.put<{ message: string; data: ProjectSummary }>(`/projects/${id}`, payload)
  return data.data
}

export async function deleteProject(id: string) {
  await api.delete(`/projects/${id}`)
}
