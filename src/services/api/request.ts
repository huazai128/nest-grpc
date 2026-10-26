import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getApiChartList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/request/chart', data)
}

export default {
  getApiChartList,
}
