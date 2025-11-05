export interface TagSummary {
  id: string
  name: string
  description?: string | null
}

export interface TagDetail extends TagSummary {
  archived?: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  projects?: Array<{
    id: string
    name?: string
    fullName?: string
    url?: string
  }>
  projectsTotal?: number
  projectsPage?: number
  projectsPageSize?: number
  projectCount?: number
}

export interface TagListItem extends TagDetail {
  archived: boolean
  createdAt: string
  updatedAt: string
  projectCount: number
}

export interface TagPayload {
  name: string
  description?: string | null
}
