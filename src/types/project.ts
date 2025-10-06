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
  languages?: string[]
  favorite?: boolean
  pinned?: boolean
  archived?: boolean
  sort?: string
  page?: number
  pageSize?: number
  tagNames?: string[]
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

export interface ProjectUpdateTag {
  id?: string
  name: string
  description?: string | null
}

export interface ProjectUpdatePayload {
  notes?: string | null
  favorite?: boolean
  pinned?: boolean
  archived?: boolean
  score?: number | null
  tags?: ProjectUpdateTag[]
  videoLinks?: string[]
}
