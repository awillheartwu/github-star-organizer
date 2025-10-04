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
}

export interface TagListItem extends TagDetail {
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface TagPayload {
  name: string
  description?: string | null
}
