import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function createSite<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.post<T>('/api/site', data)
}

function getSiteList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/site', data)
}

function deleteSiteId<T>(id: string): Promise<ResponseData<T>> {
  return http.deleteId<T>(`/api/site/${id}`, {})
}

function updateSite<T>(id: string, data: HttpParams): Promise<ResponseData<T>> {
  return http.put<T>(`/api/site/${id}`, data)
}

export default {
  createSite,
  getSiteList,
  deleteSiteId,
  updateSite,
}
