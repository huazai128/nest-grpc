import { ResponseData } from '@src/interfaces/response.iterface'
import http, { HttpParams } from '@src/services/http'

function login<T>(data: HttpParams): Promise<ResponseData<T>> {
  return http.post<T>('api/auth/login', data)
}

export default {
  login,
}
