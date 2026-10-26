import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getCustomChartList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/custom/chart', data)
}

function getCustomList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/custom', data)
}

export default {
  getCustomList,
  getCustomChartList,
}
