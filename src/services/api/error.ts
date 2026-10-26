import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function getErrorLogs<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/error', data)
}

function getErrorLogsEchart<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/error/chart', data)
}

function getErrorOverviewDate<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/error/overview', data)
}
function getErrorOverviewValues<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/error/values', data)
}

function getErrorIdByInfo<T>(id: number): Promise<ResponseData<T>> {
  return http.get<T>(`/api/error/${id}`, {})
}

function getErrorUUidbyInfo<T>(errorId: string): Promise<ResponseData<T>> {
  return http.get<T>(`/api/error/errorId`, { errorId: errorId })
}

function getErrorCount<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>(`/api/error/errorCount`, data)
}
function getErrorStatisticsList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>(`/api/error/errorStatistics`, data)
}

export default {
  getErrorIdByInfo,
  getErrorLogs,
  getErrorLogsEchart,
  getErrorOverviewDate,
  getErrorOverviewValues,
  getErrorUUidbyInfo,
  getErrorCount,
  getErrorStatisticsList,
}
