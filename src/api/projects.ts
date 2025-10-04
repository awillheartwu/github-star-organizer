import { api } from './http'
import type { PaginatedResponse } from './types'
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
    ...rest
  } = query

  const params: Record<string, unknown> = { ...rest }
  if (page) params.page = page
  if (pageSize) params.pageSize = pageSize
  if (keyword) params.keyword = keyword
  if (language) params.language = language
  if (languages?.length) params.languages = languages
  if (favorite !== undefined) params.favorite = favorite
  if (pinned !== undefined) params.pinned = pinned
  if (archived !== undefined) params.archived = archived
  if (tagNames?.length) params.tagNames = tagNames
  if (starsMin !== undefined) params.starsMin = starsMin
  if (starsMax !== undefined) params.starsMax = starsMax
  if (forksMin !== undefined) params.forksMin = forksMin
  if (forksMax !== undefined) params.forksMax = forksMax
  if (createdAtStart) params.createdAtStart = createdAtStart
  if (createdAtEnd) params.createdAtEnd = createdAtEnd
  if (updatedAtStart) params.updatedAtStart = updatedAtStart
  if (updatedAtEnd) params.updatedAtEnd = updatedAtEnd

  if (sort) {
    const [orderBy = '', orderDirection = 'asc'] = sort.split(':')
    if (orderBy) {
      params.orderBy = orderBy
      params.orderDirection = orderDirection
    }
  }

  return params
}

export async function listProjects(query: ProjectListQuery) {
  const params = buildQueryParams(query)
  const { data } = await api.get<PaginatedResponse<ProjectSummary[]>>('/projects', { params })
  return data
}

export async function getProject(id: string) {
  const { data } = await api.get<{ message: string; data: ProjectSummary }>(`/projects/${id}`)
  return data.data
}

export async function updateProject(id: string, payload: ProjectUpdatePayload) {
  const { data } = await api.put<{ message: string; data: ProjectSummary }>(`/projects/${id}`, payload)
  return data.data
}
