import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getRoutePaths<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/paths', data)
}

function getViewData<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/chart', data)
}

export default {
  getRoutePaths,
  getViewData,
}
