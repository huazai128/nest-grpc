import axios, { AxiosRequestConfig as _AxiosRequestConfig, Method } from 'axios'
import { ResponseData } from '@src/interfaces/response.iterface'
import config from '@src/config'
import { pickBy } from 'lodash'

// 扩展 Axios 请求配置接口,添加开始时间字段
export interface AxiosRequestConfig extends _AxiosRequestConfig {
  startTime?: Date
}

// 去掉null和undefined值的工具函数
const isNotEmpty = (value: any) => value !== null && value !== undefined

// HTTP请求参数类型
export type HttpParams = Record<string, any>

// GET请求参数类型
export type GetParmas = Omit<HttpParams, 'data' | 'otherConfig' | 'apiUrl'> & {
  transferData: any
}

// HTTP错误枚举
enum HTTPERROR {
  LOGICERROR, // 逻辑错误
  TIMEOUTERROR, // 超时错误
  NETWORKERROR, // 网络错误
}

// HTTP请求接口定义
interface HttpReq {
  data?: HttpParams // 请求数据
  otherConfig?: AxiosRequestConfig // 其他配置
  apiUrl: string // API地址
}

// 判断请求是否成功
const isSuccess = (res: any) => Object.is(res.status, 'success')

// 格式化返回结果
const resFormat = (res: any) => res

// 创建axios实例
const instance = axios.create({
  baseURL: config.apiHost,
  timeout: 10000, // 设置超时时间
})

// 请求拦截器 - 添加时间戳防止缓存
instance.interceptors.request.use(
  (cfg) => {
    cfg.params = { ...cfg.params, ts: Date.now() / 1000 }
    return cfg
  },
  (error) => Promise.reject(error),
)

// 响应拦截器 - 处理响应数据和错误
instance.interceptors.response.use(
  (response) => {
    const rdata = response.data
    if (!isSuccess(rdata)) {
      return Promise.reject(rdata)
    }
    return resFormat(rdata)
  },
  (error) => {
    const msg = Array.isArray(error.response?.data?.message)
      ? error.response.data?.message[0]
      : error.response?.data?.message
    return Promise.reject({
      message: msg || error.response?.data?.error || error.response?.statusText || error.message || 'network error',
      result: /^timeout of/.test(error.message)
        ? HTTPERROR[HTTPERROR.TIMEOUTERROR]
        : HTTPERROR[HTTPERROR.NETWORKERROR],
      status: 'error',
    })
  },
)

/**
 * HTTP通用请求方法
 * @param method 请求方法
 * @param param1 请求参数对象
 * @returns Promise
 */
async function httpCommon<T>(method: Method, { data, otherConfig, apiUrl }: HttpReq): Promise<ResponseData<T>> {
  try {
    const axiosConfig: AxiosRequestConfig = {
      method,
      url: apiUrl,
      ...(method === 'get' ? { params: pickBy({ ...data }, isNotEmpty) } : { data: pickBy({ ...data }, isNotEmpty) }),
      startTime: new Date(),
      ...otherConfig,
    }

    const response = await instance.request(axiosConfig)
    return response as unknown as ResponseData<T>
  } catch (err) {
    return err as unknown as ResponseData<T>
  }
}

/**
 * GET请求方法
 */
const get = <T>(apiUrl: string, data: HttpParams = {}, otherConfig: AxiosRequestConfig = {}) =>
  httpCommon<T>('get', { data, apiUrl, otherConfig })

/**
 * POST请求方法
 */
const post = <T>(apiUrl: string, data: HttpParams = {}, otherConfig: AxiosRequestConfig = {}) =>
  httpCommon<T>('post', { data, apiUrl, otherConfig })

/**
 * DELETE请求方法
 */
const deleteId = <T>(apiUrl: string, data: HttpParams = {}, otherConfig: AxiosRequestConfig = {}) =>
  httpCommon<T>('delete', { data, apiUrl, otherConfig })

/**
 * PUT请求方法
 */
const put = <T>(apiUrl: string, data: HttpParams = {}, otherConfig: AxiosRequestConfig = {}) =>
  httpCommon<T>('put', { data, apiUrl, otherConfig })

// 导出HTTP请求方法
export default {
  put,
  get,
  post,
  deleteId,
}
