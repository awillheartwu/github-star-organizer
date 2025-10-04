import type { TagSummary } from './tag'

export interface ProjectSummary {
  id: string
  githubId: number
  name: string
  fullName: string
  url: string
  description?: string | null
  language?: string | null
  stars: number
  forks: number
  lastCommit?: string | null
  lastSyncAt: string
  touchedAt?: string | null
  notes?: string | null
  favorite: boolean
  archived: boolean
  pinned: boolean
  score?: number | null
  summaryShort?: string | null
  summaryLong?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  tags: TagSummary[]
  videoLinks: string[]
}

export interface PaginatedProjects {
  data: ProjectSummary[]
  page: number
  pageSize: number
  total: number
}

export interface ProjectFilters {
  keyword?: string
  language?: string
  favorite?: boolean
  pinned?: boolean
  sort?: string
  page?: number
  pageSize?: number
  tagNames?: string[]
}

export interface ProjectUpdatePayload {
  notes?: string | null
  favorite?: boolean
  pinned?: boolean
  archived?: boolean
  score?: number | null
}
