import { isAxiosError } from 'axios'
import { api } from './http'
import type { PaginatedResponse } from './types'
import type { AiBatchItem, ArchivedProjectSnapshot, QueuesStatus, SyncState } from '../types/admin'

export interface SyncStarsPayload {
  mode: 'full' | 'incremental'
  perPage?: number
  maxPages?: number
  softDeleteUnstarred?: boolean
  note?: string
}

export interface AiSummaryPayload {
  projectIds: string[]
  options?: {
    style?: 'short' | 'long' | 'both'
    lang?: 'zh' | 'en'
    model?: string
    temperature?: number
    createTags?: boolean
    includeReadme?: boolean
    readmeMaxChars?: number
  }
  note?: string
}

export interface AiSweepPayload {
  limit?: number
  lang?: 'zh' | 'en'
  model?: string
  force?: boolean
  staleDaysOverride?: number
}

export interface ArchivedProjectsQuery {
  page?: number
  pageSize?: number
  reason?: 'manual' | 'unstarred'
}

export interface AiBatchQuery {
  page?: number
  pageSize?: number
}

export async function getQueuesStatus() {
  const { data } = await api.get<QueuesStatus>('/admin/queues')
  return data
}

export async function triggerSyncStars(payload: SyncStarsPayload) {
  const { data } = await api.post<{ message: string; jobId: string }>('/admin/sync-stars', payload)
  return data
}

export async function getSyncState() {
  try {
    const { data } = await api.get<SyncState>('/admin/sync-state')
    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function listArchivedProjects(query: ArchivedProjectsQuery) {
  const { data } = await api.get<PaginatedResponse<ArchivedProjectSnapshot[]>>(
    '/admin/archived-projects',
    { params: query }
  )
  return data
}

export async function getArchivedProject(id: string) {
  const { data } = await api.get<{ message: string; data: ArchivedProjectSnapshot }>(
    `/admin/archived-projects/${id}`
  )
  return data.data
}

export async function enqueueAiSummary(payload: AiSummaryPayload) {
  const { data } = await api.post<{ message: string; enqueued: number }>(
    '/admin/ai/summary/enqueue',
    payload
  )
  return data
}

export async function enqueueAiSweep(payload: AiSweepPayload) {
  const { data } = await api.post<{ message: string; enqueued: number; total: number }>(
    '/admin/ai/summary/sweep',
    payload
  )
  return data
}

export async function listAiBatches(query: AiBatchQuery) {
  const { data } = await api.get<PaginatedResponse<AiBatchItem[]>>('/admin/ai/batches', {
    params: query,
  })
  return data
}

export async function getAiBatch(id: string) {
  const { data } = await api.get<{ message: string; data: AiBatchItem }>(`/admin/ai/batches/${id}`)
  return data.data
}

export async function runMaintenance() {
  const { data } = await api.post<{ message: string; jobId: string }>('/admin/maintenance/run')
  return data
}
