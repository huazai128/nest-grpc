import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getuserLogChartList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/userLog/chart', data)
}

function getuserLogList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/userLog', data)
}

function getIdByInfo<T>(id: number): Promise<ResponseData<T>> {
  return http.get<T>(`/api/userLog/${id}`, {})
}

export default {
  getuserLogChartList,
  getuserLogList,
  getIdByInfo,
}
