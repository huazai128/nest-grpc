import axios, { AxiosRequestConfig as _AxiosRequestConfig, Method } from 'axios'
import { ResponseData } from '@src/interfaces/response.iterface'
import config from '@src/config'
import { pickBy } from 'lodash'

export interface AxiosRequestConfig extends _AxiosRequestConfig {
  startTime?: Date
}

// 去掉null和undefined
const isNotEmpty = (value: any) => value !== null && value !== undefined

export type HttpParams = Record<string, any>

export type GetParmas = Omit<HttpParams, 'data' | 'otherConfig' | 'apiUrl'> & {
  transferData: any
}

enum HTTPERROR {
  LOGICERROR,
  TIMEOUTERROR,
  NETWORKERROR,
}

interface HttpReq {
  data?: HttpParams
  otherConfig?: AxiosRequestConfig
  apiUrl: string
}

// 判断请求是否成功
const isSuccess = (res: any) => Object.is(res.status, 'success')
// 格式化返回结果
const resFormat = (res: any) => res

function httpCommon<T>(method: Method, { data, otherConfig, apiUrl }: HttpReq): Promise<ResponseData<T> | any> {
  let axiosConfig: AxiosRequestConfig = {
    method,
    url: apiUrl,
    baseURL: config.apiHost,
  }
  const instance = axios.create()

  // 请求拦截
  instance.interceptors.request.use(
    (cfg) => {
      cfg.params = { ...cfg.params, ts: Date.now() / 1000 }
      return cfg
    },
    (error) => Promise.reject(error),
  )

  // 响应拦截
  instance.interceptors.response.use(
    (response) => {
      const rdata = response.data
      if (!isSuccess(rdata)) {
        return Promise.reject(rdata)
      }
      return resFormat(rdata)
    },
    (error) => {
      return Promise.reject({
        message: error.response.data.error || error.response.statusText || error.message || 'network error',
        result: /^timeout of/.test(error.message)
          ? HTTPERROR[HTTPERROR.TIMEOUTERROR]
          : HTTPERROR[HTTPERROR.NETWORKERROR],
        status: 'error',
      })
    },
  )
  data = pickBy({ ...data }, isNotEmpty)
  if (method === 'get') {
    axiosConfig.params = data
  } else {
    axiosConfig.data = data
  }

  axiosConfig.startTime = new Date()
  if (otherConfig) {
    axiosConfig = Object.assign(axiosConfig, otherConfig)
  }
  return instance
    .request(axiosConfig)
    .then((res) => res)
    .catch((err) => {
      return err
    })
}

function get<T>(apiUrl: string, data: HttpParams, otherConfig: AxiosRequestConfig = {}) {
  return httpCommon<T>('get', { data, apiUrl, otherConfig })
}

function post<T>(apiUrl: string, data: HttpParams, otherConfig: AxiosRequestConfig = {}) {
  return httpCommon<T>('post', { data, apiUrl, otherConfig })
}

function deleteId<T>(apiUrl: string, data: HttpParams, otherConfig: AxiosRequestConfig = {}) {
  return httpCommon<T>('delete', { data, apiUrl, otherConfig })
}

function put<T>(apiUrl: string, data: HttpParams, otherConfig: AxiosRequestConfig = {}) {
  return httpCommon<T>('put', { data, apiUrl, otherConfig })
}

export default {
  put,
  get,
  post,
  deleteId,
}
