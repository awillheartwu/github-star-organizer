import { api } from './http'
import type { PaginatedResponse } from './types'
import type { TagDetail, TagListItem, TagPayload } from '../types/tag'

export interface TagListQuery {
  page?: number
  pageSize?: number
  archived?: boolean
  keyword?: string
  sort?: string
}

function buildQueryParams(query: TagListQuery) {
  const params: Record<string, unknown> = {}
  if (query.page) params.page = query.page
  if (query.pageSize) params.pageSize = query.pageSize
  if (query.archived !== undefined) params.archived = query.archived
  if (query.keyword) params.keyword = query.keyword
  if (query.sort) {
    const [orderBy = '', orderDirection = 'desc'] = query.sort.split(':')
    if (orderBy) {
      params.orderBy = orderBy
      params.orderDirection = orderDirection
    }
  }
  return params
}

export async function listTags(query: TagListQuery) {
  const params = buildQueryParams(query)
  const { data } = await api.get<PaginatedResponse<TagListItem[]>>('/tags', { params })
  return data
}

export interface TagDetailQuery {
  projectsPage?: number
  projectsPageSize?: number
}

export async function getTag(id: string, params?: TagDetailQuery) {
  const queryParams: Record<string, number> = {}
  if (params?.projectsPage) queryParams.projectsPage = params.projectsPage
  if (params?.projectsPageSize) queryParams.projectsPageSize = params.projectsPageSize
  const { data } = await api.get<{ message: string; data: TagDetail }>(`/tags/${id}`, {
    params: queryParams,
  })
  return data.data
}

export async function createTag(payload: TagPayload) {
  const { data } = await api.post<{ message: string; data: TagDetail }>('/tags', payload)
  return data.data
}

export async function updateTag(id: string, payload: Partial<TagPayload>) {
  const { data } = await api.put<{ message: string; data: TagDetail }>(`/tags/${id}`, payload)
  return data.data
}

export async function deleteTag(id: string) {
  await api.delete(`/tags/${id}`)
}
