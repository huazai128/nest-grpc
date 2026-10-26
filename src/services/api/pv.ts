import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getSingleDay<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/singleDay', data)
}

function getPvDataChart<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/chart', data)
}

function getTerminalDataOneDay<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/terminalDataOneDay', data)
}

function getStatisticsPathData<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/statisticsPathData', data)
}

function getSingleDayPathData<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/getSingleDayPathData', data)
}

function getStatisticsEquipment<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/pv/getStatisticsEquipment', data)
}
export default {
  getSingleDay,
  getPvDataChart,
  getTerminalDataOneDay,
  getStatisticsPathData,
  getSingleDayPathData,
  getStatisticsEquipment,
}
