import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function login<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.post<T>('/api/login', data)
}

function getUserInfo<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('/api/user', data)
}

export default {
  login,
  getUserInfo,
}
