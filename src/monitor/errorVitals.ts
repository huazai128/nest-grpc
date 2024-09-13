/* eslint-disable @typescript-eslint/no-this-alias */
import { CommonExtends } from './commonExtends'
import { proxyFetch, proxyXmlHttp } from './httpProxy'
import {
  ErrorInfo,
  ExceptionMetrics,
  HttpMetrics,
  MechanismType,
  TransportCategory,
} from './interfaces/util.interface'
import { getErrorKey, getErrorUid, parseStackFrames } from './utils'
import isHtml from 'is-html'
import { v4 as uuidv4 } from 'uuid'

/**
 * 错误采集上报
 * @export
 * @class ErrorVitals
 * @extends {CommonExtend}
 */
export default class ErrorVitals extends CommonExtends {
  private errorUids: Array<string> = [] // 生成同一个
  constructor() {
    super()
    this.initJsError()
    this.initResourceError()
    this.initPromiseError()
    this.initHttpError()
    this.initCorsError()
  }

  /**
   * 所有的错误信息上报
   * @param {ExceptionMetrics} error
   * @memberof ErrorVitals
   */
  errorSendHandler = async ({ meta, stackTrace, ...error }: ExceptionMetrics) => {
    let errorInfo: any = {
      ...error,
      category: TransportCategory.ERROR,
    }
    const monitorId = TransportCategory.ERROR + uuidv4()
    const hasStatus = this.errorUids.includes(errorInfo.errorUid)
    // 处理重复错误上报
    if (hasStatus) return false
    // 保存上报错误uid， 防止同一个用户重复上报
    this.errorUids.push(errorInfo.errorUid)
    // 删除
    delete errorInfo.errorUid
    // 错误信息
    errorInfo = { ...errorInfo, meta: meta, stackTrace: stackTrace, monitorId }
    // 发送
    this.sendLog.add(errorInfo)
  }

  /**
   * 初始化监听JS异常
   * @memberof ErrorVitals
   */
  initJsError = () => {
    const handler = (event: ErrorEvent) => {
      event.preventDefault()
      // 这里只搜集js 错误
      if (getErrorKey(event) !== MechanismType.JS) return false
      const errUid = getErrorUid(`${MechanismType.JS}-${event.message}-${event.filename}`)
      const errInfo = {
        // 上报错误归类
        reportsType: MechanismType.JS,
        // 错误信息
        value: event.message,
        // 错误类型
        errorType: event?.error?.name || 'UnKnowun',
        // 解析后的错误堆栈
        stackTrace: parseStackFrames(event.error),
        // 用户行为追踪 breadcrumbs 在 errorSendHandler 中统一封装
        // 错误的标识码
        errorUid: errUid,
        // 其他信息
        meta: {
          // file 错误所处的文件地址
          file: event.filename,
          // col 错误列号
          col: event.colno,
          // row 错误行号
          row: event.lineno,
        },
      } as ExceptionMetrics
      this.errorSendHandler(errInfo)
    }
    window.addEventListener('error', (e) => handler(e), true)
  }

  /**
   * 初始化监听静态资源异常上报
   * @memberof ErrorVitals
   */
  initResourceError = () => {
    const handler = (e: Event) => {
      e.preventDefault()
      // 只采集静态资源错误信息
      if (getErrorKey(e) !== MechanismType.RS) return false
      const target = e.target as any
      const errUid = getErrorUid(`${MechanismType.RS}-${target.src}-${target.tagName}`)
      const errInfo = {
        // 上报错误归类
        reportsType: MechanismType.RS,
        // 错误信息
        value: '',
        // 错误类型
        errorType: 'ResourceError',
        // 用户行为追踪 breadcrumbs 在 errorSendHandler 中统一封装
        // 错误的标识码
        errorUid: errUid,
        // 其他信息
        meta: {
          url: target.src,
          html: target.outerHTML,
          type: target.tagName,
        },
      } as ExceptionMetrics
      this.errorSendHandler(errInfo)
    }
    window.addEventListener('error', (e) => handler(e), true)
  }

  /**
   * 初始化监听promise 错误， 但是HTTP请求时报错，不清楚是那个接口报错了。
   * @memberof ErrorVitals
   */
  initPromiseError = () => {
    const handler = (e: PromiseRejectionEvent) => {
      e.preventDefault()
      let value = e.reason.message || e.reason
      if (Object.prototype.toString.call(value) === '[Object Object]') {
        value = JSON.stringify(value)
      }
      const type = e.reason.name || 'UnKnowun'
      const errUid = getErrorUid(`${MechanismType.UJ}-${value}-${type}`)
      const errorInfo = {
        // 上报错误归类
        reportsType: MechanismType.UJ,
        // 错误信息
        value: value,
        // 错误类型
        errorType: type,
        // 解析后的错误堆栈
        stackTrace: parseStackFrames(e.reason),
        // 用户行为追踪 breadcrumbs 在 errorSendHandler 中统一封装
        // 错误的标识码
        errorUid: errUid,
        // 附带信息
        meta: {},
      } as ExceptionMetrics
      this.errorSendHandler(errorInfo)
    }
    window.addEventListener('unhandledrejection', (e) => handler(e), true)
  }

  /**
   * 用于处理promise 错误中，无法获取是那个接口报错
   * @memberof ErrorVitals
   */
  initHttpError = () => {
    const loadHandler = (metrics: HttpMetrics) => {
      const res = metrics.response

      const qUrl = String(metrics.url)?.split('?')[0] || ''
      const value = metrics.response
      if (metrics.status < 400 && (res?.status == 'success' || res?.status >= 0)) return false

      const errUid = getErrorUid(`${MechanismType.HP}-${value}-${metrics.statusText}`)
      const errorInfo = {
        // 上报错误归类
        reportsType: MechanismType.HP,
        // 错误信息
        value: JSON.stringify(value),
        // 错误类型
        errorType: 'HttpError',
        // 用户行为追踪 breadcrumbs 在 errorSendHandler 中统一封装
        // 错误的标识码
        errorUid: errUid,
        // 附带信息
        meta: {
          ...metrics,
          body: typeof metrics.body === 'string' && isHtml(metrics.body) ? '[-Body内容为HTML已过滤-]' : metrics.body,
        },
      } as ExceptionMetrics
      this.errorSendHandler(errorInfo)
    }
    proxyXmlHttp(null, loadHandler)
    proxyFetch(null, loadHandler)
  }

  /**
   * 监听跨域报错
   * @memberof ErrorVitals
   */
  initCorsError = (): void => {
    const handler = (event: ErrorEvent) => {
      // 阻止向上抛出控制台报错
      event.preventDefault()
      // 如果不是跨域脚本异常,就结束
      if (getErrorKey(event) !== MechanismType.CS) return
      const exception = {
        // 上报错误归类
        reportsType: MechanismType.CS,
        // 错误信息
        value: event.message,
        // 错误类型
        errorType: 'CorsError',
        // 错误的标识码
        errorUid: getErrorUid(`${MechanismType.CS}-${event.message}`),
        // 附带信息
        meta: {},
      } as ExceptionMetrics
      // 自行上报异常，也可以跨域脚本的异常都不上报;
      this.errorSendHandler(exception)
    }
    window.addEventListener('error', (event) => handler(event), true)
  }

  /**
   * react 组件错误上报
   * @param {*} error
   * @memberof ErrorVitals
   */
  initReactError = (error: Error, errorInfo: ErrorInfo) => {
    const errUid = getErrorUid(`${MechanismType.REACT}-${error.name}-${error.message}`)
    const errInfo = {
      // 上报错误归类
      reportsType: MechanismType.REACT,
      // 错误信息
      value: error.message,
      // 错误类型
      errorType: error?.name || 'UnKnowun',
      // 解析后的错误堆栈
      stackTrace: parseStackFrames(error),
      // 用户行为追踪 breadcrumbs 在 errorSendHandler 中统一封装
      // 错误的标识码
      errorUid: errUid,
      // 其他信息
      meta: {
        // 错误所在的组件
        file: parseStackFrames({ stack: errorInfo.componentStack } as any),
        // 组件名称
        conponentName: errorInfo.componentName,
      },
    } as ExceptionMetrics
    this.errorSendHandler(errInfo)
  }
}
