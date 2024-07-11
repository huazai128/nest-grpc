import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function login<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.post<T>('api/auth/login', data)
}

function getUserList<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.get<T>('api/auth/list', data)
}

export default {
  login,
  getUserList,
}
