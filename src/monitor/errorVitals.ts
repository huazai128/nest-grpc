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

const store = localForage.createInstance({
  name: 'recordLog',
})

/**
 * 判断是否存在
 * @param {Record<string, any>} obj
 * @return {*}  {boolean}
 */
function hasHtmlAndBodyTags(obj: Record<string, any>): boolean {
  const values = Object.values(obj)
  return (
    (values.some((value) => typeof value === 'string' && value.includes('<html>')) ||
      values.some((value) => typeof value === 'object' && value !== null && hasHtmlAndBodyTags(value))) &&
    (values.some((value) => typeof value === 'string' && value.includes('<body>')) ||
      values.some((value) => typeof value === 'object' && value !== null && hasHtmlAndBodyTags(value)))
  )
}

/**
 * 错误采集上报
 * @export
 * @class ErrorVitals
 * @extends {CommonExtend}
 */
export default class ErrorVitals extends CommonExtends {
  // 用于存储错误ID，防止重复提交错误
  private errorUids: Array<string> = []
  // 用于存储录制数据
  private eventsMatrix: any[] = []
  // 当前录制ID
  private curRecordId!: string
  // 是否开始录制
  private isStartRecord: boolean = false
  // 保存最近10个录制数据
  private reordHistoryKeys: string[] = []
  // 缓存历史的keys
  private historyKeys: string = 'historyKeys'
  // 缓存录制key
  private curRecordKey: string = 'curRecordKey'
  // 每个错误记录10个录屏
  private keysLen = 10
  constructor() {
    super()
    this.initJsError()
    this.initResourceError()
    this.initPromiseError()
    this.initHttpError()
    this.initCorsError()
    this.onPageLoad()
  }

  /**
   * 初始化获取缓存数据
   * @memberof ErrorVitals
   */
  initStore = () => {
    // 获取历史中的录屏记录, 这里无为顺序问题。
    store.getItem(this.historyKeys).then((list) => {
      this.reordHistoryKeys = (list || []) as string[]
    })
    // 获取历史录屏记录没有上报的数据，如录制时，还没有触发重新快照的数据，进行上报
    store.getItem(this.curRecordKey).then((value: any) => {
      if (!!value) {
        this.sendLog.add({
          category: TransportCategory.RV,
          events: JSON.stringify(value.events),
          monitorId: value.monitorId,
        })
      }
    })
  }

  /**
   * 等页面加载完成
   * @memberof ErrorVitals
   */
  onPageLoad = () => {
    // 只允许触发一次，后面不在触发录屏
    const handler = () => {
      if (!this.isStartRecord) {
        this.isStartRecord = true
        this.startRecordId()
        this.startRecord()
      }
    }
    window.addEventListener('pageshow', handler, { once: true, capture: true })
  }

  /**
   * 所有的错误信息上报
   * @param {ExceptionMetrics} error
   * @memberof ErrorVitals
   */
  errorSendHandler = async ({ meta, stackTrace, ...error }: ExceptionMetrics) => {
    let errorInfo: any = {
      ...error,
      category: TransportCategory.ERROR, // 错误类型
      breadcrumbs: this.sendLog.getList(), // 用户行为记录
    }
    // 记录用户行为id，用于查看用户操作行为，减少传递数据过大问题。
    const monitorId = TransportCategory.ERROR + uuidv4()
    // 防止错误重复上报
    const hasStatus = this.errorUids.includes(errorInfo.errorUid)
    // 处理重复错误上报
    if (hasStatus) return false
    // 保存上报错误uid， 防止同一个用户重复上报
    this.errorUids.push(errorInfo.errorUid)
    // 删除
    delete errorInfo.errorUid
    // 错误信息 ，recordKeys: 关联最近上报的录屏记录
    errorInfo = { ...errorInfo, meta: meta, stackTrace: stackTrace, monitorId, recordKeys: this.reordHistoryKeys }
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
          // html: target.outerHTML, // 剔除过大
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
      let res = metrics.response
      if (metrics.status < 400 && (res?.status == 'success' || res?.status >= 0)) return false
      const errUid = getErrorUid(`${MechanismType.HP}-${res}-${metrics.statusText}`)
      if (hasHtmlAndBodyTags(res)) {
        res = {
          ...res,
          result: '[-Body内容为HTML已过滤-]',
        }
      }
      const errorInfo = {
        // 上报错误归类
        reportsType: MechanismType.HP,
        // 错误信息
        value: JSON.stringify(res),
        // 错误类型
        errorType: 'HttpError',
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

  /**
   * 录制
   * @memberof ErrorVitals
   */
  startRecord = () => {
    const self = this
    record({
      emit(event, isCheckout) {
        self.emitRecord(event, isCheckout)
      },
      recordCanvas: true, // 是否记录canvas内容。
      checkoutEveryNth: 200,
    })
  }

  /**
   * 监听录制事件
   * @param {*} event
   * @param {boolean} [isCheckout]
   * @memberof ErrorVitals
   */
  emitRecord = (event: any, isCheckout?: boolean) => {
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
      store.setItem(this.curRecordKey, {
        monitorId: this.curRecordId,
        events: this.eventsMatrix,
      })
    }
  }

  /**
   * 存储最近录制10条记录
   * @param {string} key
   * @memberof ErrorVitals
   */
  pushRecord = (key: string) => {
    if (this.reordHistoryKeys.length < this.keysLen) {
      this.reordHistoryKeys.push(key)
    } else {
      this.reordHistoryKeys.shift()
      this.reordHistoryKeys.push(key)
    }
    store.setItem(this.historyKeys, this.reordHistoryKeys)
  }

  /**
   * 重新生成id，这里的id 是前端生成的，方便后续关联。因为日志上报保存返回204，不会等保存成功在关联。
   * @memberof ErrorVitals
   */
  startRecordId = () => {
    this.curRecordId = TransportCategory.RV + uuidv4()
    this.pushRecord(this.curRecordId)
  }
}
