import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getLogs<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/log/list', data)
}

function getLogsByCursor<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/log/cursor', data)
}

function getLogsChart<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/log/chart', data)
}

function getAggregationPathOrUrl<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/log/aggregationPathOrUlr', data)
}
function getMemoryData<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/log/getMemoryData', data)
}

export default {
  getLogs,
  getLogsByCursor,
  getLogsChart,
  getAggregationPathOrUrl,
  getMemoryData,
}
