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
import { record } from '@rrweb/record'
import localForage from 'localforage'

// 创建本地存储实例,用于存储录制的日志
const store = localForage.createInstance({
  name: 'recordLog',
})

/**
 * 检查对象是否包含HTML和BODY标签
 * @param obj 要检查的对象
 * @returns 是否同时包含HTML和BODY标签
 */
function hasHtmlAndBodyTags(obj: Record<string, any>): boolean {
  const values = Object.values(obj)
  const hasHtml = values.some(
    (value) =>
      (typeof value === 'string' && value.includes('<html>')) ||
      (typeof value === 'object' && value && hasHtmlAndBodyTags(value)),
  )
  const hasBody = values.some(
    (value) =>
      (typeof value === 'string' && value.includes('<body>')) ||
      (typeof value === 'object' && value && hasHtmlAndBodyTags(value)),
  )
  return hasHtml && hasBody
}

/**
 * 错误采集上报类
 * 主要监控以下行为:
 * - 错误上报，需要关联页面信息，所以需要记录页面信息
 * - 错误上报，需要关联行为信息，所以需要记录行为信息
 * - 错误上报，需要关联性能信息，所以需要记录性能信息
 * - 错误上报，需要关联用户信息，所以需要记录用户信息
 * - 错误上报，需要关联自定义信息，所以需要记录自定义信息
 * - 错误上报，需要关联请求信息，所以需要记录请求信息
 * - 错误上报，需要关联响应信息，所以需要记录响应信息
 */
export default class ErrorVitals extends CommonExtends {
  // 本地存储的key常量
  private readonly HISTORY_KEYS = 'historyKeys'
  private readonly CURRENT_RECORD_KEY = 'curRecordKey'
  // 最大记录数量
  private readonly MAX_RECORD_KEYS = 10

  // 已处理的错误ID集合
  private errorUids: string[] = []
  // 录制的事件矩阵
  private eventsMatrix: any[] = []
  // 当前录制ID
  private curRecordId!: string
  // 是否开始录制标志
  private isStartRecord = false
  // 录制历史key列表
  private reordHistoryKeys: string[] = []

  constructor() {
    super()
    this.initializeErrorHandlers()
    this.onPageLoad()
  }

  /**
   * 初始化所有错误处理器
   */
  private initializeErrorHandlers() {
    this.initJsError()
    this.initResourceError()
    this.initPromiseError()
    this.initHttpError()
    this.initCorsError()
  }

  /**
   * 初始化本地存储
   */
  private async initStore() {
    try {
      // 获取历史记录列表
      const historyList = await store.getItem(this.HISTORY_KEYS)
      this.reordHistoryKeys = (historyList || []) as string[]

      // 获取当前记录
      const currentRecord = (await store.getItem(this.CURRENT_RECORD_KEY)) as any
      if (currentRecord) {
        this.sendLog.add({
          category: TransportCategory.RV,
          events: JSON.stringify(currentRecord.events),
          monitorId: currentRecord.monitorId,
        })
      }
    } catch (error) {
      console.error('Failed to initialize store:', error)
    }
  }

  /**
   * 页面加载时的处理
   */
  private onPageLoad() {
    const handler = () => {
      window.addEventListener('load', () => {
        if (!this.isStartRecord) {
          this.isStartRecord = true
          this.startRecordId()
          this.startRecord()
        }
      })
    }
    window.addEventListener('pageshow', handler, { once: true, capture: true })
  }

  /**
   * 错误发送处理器
   * @param error 错误信息
   */
  private async errorSendHandler({ meta, stackTrace, ...error }: ExceptionMetrics) {
    const monitorId = `${TransportCategory.ERROR}${uuidv4()}`

    // 避免重复发送相同错误
    if (this.errorUids.includes(error.errorUid)) {
      return false
    }

    this.errorUids.push(error.errorUid)

    const errorInfo = {
      ...error,
      category: TransportCategory.ERROR,
      breadcrumbs: this.sendLog.getList(),
      meta,
      stackTrace,
      monitorId,
      recordKeys: this.reordHistoryKeys,
    }
    this.sendLog.add(errorInfo)
  }

  /**
   * 初始化JS错误监听
   */
  private initJsError() {
    const handler = (event: ErrorEvent) => {
      event.preventDefault()

      if (getErrorKey(event) !== MechanismType.JS) return false

      const errUid = getErrorUid(`${MechanismType.JS}-${event.message}-${event.filename}`)
      const errInfo: ExceptionMetrics = {
        reportsType: MechanismType.JS,
        value: event.message,
        errorType: event?.error?.name || 'Unknown',
        stackTrace: parseStackFrames(event.error),
        errorUid: errUid,
        meta: {
          file: event.filename,
          col: event.colno,
          row: event.lineno,
        },
      }

      this.errorSendHandler(errInfo)
    }

    window.addEventListener('error', handler, true)
  }

  /**
   * 初始化资源加载错误监听
   */
  private initResourceError() {
    const handler = (e: Event) => {
      e.preventDefault()

      if (getErrorKey(e) !== MechanismType.RS) return false

      const target = e.target as any
      const errUid = getErrorUid(`${MechanismType.RS}-${target.src}-${target.tagName}`)

      const errInfo: ExceptionMetrics = {
        reportsType: MechanismType.RS,
        value: '',
        errorType: 'ResourceError',
        errorUid: errUid,
        meta: {
          url: target.src,
          type: target.tagName,
        },
      }

      this.errorSendHandler(errInfo)
    }

    window.addEventListener('error', handler, true)
  }

  /**
   * 初始化Promise错误监听
   */
  private initPromiseError() {
    const handler = (e: PromiseRejectionEvent) => {
      e.preventDefault()

      let value = e.reason.message || e.reason
      if (Object.prototype.toString.call(value) === '[Object Object]') {
        value = JSON.stringify(value)
      }

      const type = e.reason.name || 'Unknown'
      const errUid = getErrorUid(`${MechanismType.UJ}-${value}-${type}`)

      const errorInfo: ExceptionMetrics = {
        reportsType: MechanismType.UJ,
        value,
        errorType: type,
        stackTrace: parseStackFrames(e.reason),
        errorUid: errUid,
        meta: {},
      }

      this.errorSendHandler(errorInfo)
    }

    window.addEventListener('unhandledrejection', handler, true)
  }

  /**
   * 初始化HTTP错误监听
   */
  private initHttpError() {
    const loadHandler = (metrics: HttpMetrics) => {
      let res = metrics.response
      if (metrics.status < 400 && (res?.status === 'success' || res?.status >= 0)) {
        return false
      }

      const errUid = getErrorUid(`${MechanismType.HP}-${res}-${metrics.statusText}`)

      if (hasHtmlAndBodyTags(res)) {
        res = {
          ...res,
          result: '[-Body内容为HTML已过滤-]',
        }
      }

      const errorInfo: ExceptionMetrics = {
        reportsType: MechanismType.HP,
        value: JSON.stringify(res),
        errorType: 'HttpError',
        errorUid: errUid,
        meta: {
          ...metrics,
          body: typeof metrics.body === 'string' && isHtml(metrics.body) ? '[-Body内容为HTML已过滤-]' : metrics.body,
        },
      }

      this.errorSendHandler(errorInfo)
    }

    proxyXmlHttp(null, loadHandler)
    proxyFetch(null, loadHandler)
  }

  /**
   * 初始化跨域错误监听
   */
  private initCorsError() {
    const handler = (event: ErrorEvent) => {
      event.preventDefault()

      if (getErrorKey(event) !== MechanismType.CS) return

      const exception: ExceptionMetrics = {
        reportsType: MechanismType.CS,
        value: event.message,
        errorType: 'CorsError',
        errorUid: getErrorUid(`${MechanismType.CS}-${event.message}`),
        meta: {},
      }

      this.errorSendHandler(exception)
    }

    window.addEventListener('error', handler, true)
  }

  /**
   * 初始化React错误处理
   * @param error Error对象
   * @param errorInfo 错误信息
   */
  public initReactError(error: Error, errorInfo: ErrorInfo) {
    const errUid = getErrorUid(`${MechanismType.REACT}-${error.name}-${error.message}`)

    const errInfo: ExceptionMetrics = {
      reportsType: MechanismType.REACT,
      value: error.message,
      errorType: error?.name || 'Unknown',
      stackTrace: parseStackFrames(error),
      errorUid: errUid,
      meta: {
        file: parseStackFrames({ stack: errorInfo.componentStack } as any),
        componentName: errorInfo.componentName,
      },
    }

    this.errorSendHandler(errInfo)
  }

  /**
   * 开始录制
   */
  private startRecord() {
    record({
      emit: (event, isCheckout) => this.emitRecord(event, isCheckout),
      recordCanvas: true,
      checkoutEveryNth: 200,
    })
  }

  /**
   * 录制事件处理
   * @param event 录制的事件
   * @param isCheckout 是否检查点
   */
  private emitRecord(event: any, isCheckout?: boolean) {
    if (isCheckout) {
      this.sendLog.add({
        category: TransportCategory.RV,
        events: JSON.stringify(this.eventsMatrix),
        monitorId: this.curRecordId,
      })
      this.eventsMatrix = []
      this.startRecordId()
    } else {
      this.eventsMatrix.push(event)
      store.setItem(this.CURRENT_RECORD_KEY, {
        monitorId: this.curRecordId,
        events: this.eventsMatrix,
      })
    }
  }

  /**
   * 添加录制记录
   * @param key 记录的key
   */
  private pushRecord(key: string) {
    if (this.reordHistoryKeys.length < this.MAX_RECORD_KEYS) {
      this.reordHistoryKeys.push(key)
    } else {
      this.reordHistoryKeys.shift()
      this.reordHistoryKeys.push(key)
    }
    store.setItem(this.HISTORY_KEYS, this.reordHistoryKeys)
  }

  /**
   * 开始新的录制ID
   */
  private startRecordId() {
    this.curRecordId = `${TransportCategory.RV}${uuidv4()}`
    this.pushRecord(this.curRecordId)
  }
}
