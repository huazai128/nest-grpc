import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getPrefChart<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pref/chart', data)
}
function getTimeConsuming<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pref/time-consuming', data)
}

function getTimeMaxData<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pref/max-time', data)
}

export default {
  getPrefChart,
  getTimeConsuming,
  getTimeMaxData,
}
