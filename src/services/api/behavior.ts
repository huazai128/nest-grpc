import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getEventChartList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/event/chart', data)
}

function getEventList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/event', data)
}

export default {
  getEventList,
  getEventChartList,
}
