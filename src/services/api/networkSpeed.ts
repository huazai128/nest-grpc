import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

const getList = <T>(data: HttpParams): Promise<ResponseData<T>> => http.get<T>('/api/network-speed-log', data)

const getChart = <T>(data: HttpParams): Promise<ResponseData<T>> => http.get<T>('/api/network-speed-log/chart', data)

export default { getList, getChart }
