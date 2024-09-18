export interface Pagination {
  current_page: number
  per_page?: number
  total: number
  total_page: number
  dataTotal?: number
  nextCursor?: number
  hasNextPage?: boolean
}

export interface ResponsePaginationData<T> {
  data: Array<T>
  pagination: Pagination
}

export interface ResponseData<T = any> {
  message: string
  result: T
  status: 'success' | 'error'
}
