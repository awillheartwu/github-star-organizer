export interface ApiResponse<T> {
  message: string
  data: T
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page: number
  pageSize: number
  total: number
}
