import { ConfigProps } from './interfaces/config.interface'
import { IMetrics, PageInfo } from './interfaces/util.interface'
import { getCookie, proxyHash, proxyHistory, wrHistory } from './utils'
import LogStore from './logStore'
import CircularJSON from 'circular-json'
import { v4 as uuidv4 } from 'uuid'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  // 基础页面信息
  private pageInfo: PageInfo = {}
  // 动态页面信息
  private dInfo: PageInfo = {}
  // 配置信息
  private config!: ConfigProps
  // 上报url
  private url!: string
  // 当前页面路径
  private curHref!: string
  // 上个页面路径
  private prevHref!: string
  // 每次页面发生变化都会重新生成一个pageId
  private pageId!: string
  // 每次初始化都会产生一个
  public traceId!: string
  constructor() {
    super()
    wrHistory()
    this.getInit()
    this.initRouterChange()
  }

  /**
   * 初始化生成traceId
   * @memberof SendLog
   */
  getInit() {
    // 如果是刷新页面还是使用来的traceId
    const traceId = sessionStorage.getItem('traceId')
    if (traceId && traceId.length > 40) {
      this.traceId = traceId
    } else {
      this.traceId = 'traceId:' + uuidv4()
      sessionStorage.setItem('traceId', this.traceId)
    }
  }

  /**
   * 用于监听路由的变化
   * @memberof SendLog
   */
  initRouterChange = () => {
    const handler = (e: Event) => {
      this.dynamicInfo(e)
    }
    window.addEventListener('pageshow', handler, { once: true, capture: true })
    proxyHash(handler)
    proxyHistory(handler)
  }

  /**
   * 配置设置
   * @param {ConfigProps} config
   * @memberof SendLog
   */
  setConfig(config: ConfigProps) {
    this.config = config
    this.url = this.config.url + '/api/log/multi'
  }

  /**
   * 初始化获取页面信息, 页面信息只有在初始化时获取，其他都不需要更新
   * @memberof SendLog
   */
  initPageInfo = () => {
    const userId = getCookie('userId') || getCookie('osudb_uid')
    const { width, height } = window.screen
    const { language } = navigator
    this.pageInfo = {
      lang: language.substr(0, 2),
      winScreen: `${width}x${height}`,
      docScreen: `${document.documentElement.clientWidth || document.body.clientWidth}x${
        document.documentElement.clientHeight || document.body.clientHeight
      }`,
      userId: userId,
      traceId: this.traceId,
    }
  }

  /**
   * 动态获取当前页面path和referrer
   * @memberof SendLog
   */
  dynamicInfo = (e?: Event) => {
    const { pathname, href } = window.location
    if (this.curHref != href) {
      this.prevHref = this.curHref
    }
    this.curHref = href
    this.pageId = 'pageId:' + uuidv4()
    this.dInfo = {
      path: pathname,
      referrer: document.referrer,
      prevHref: this.prevHref,
      title: document.title,
      href,
      jumpType: e?.type || '',
      type: performance?.navigation?.type,
      pageId: this.pageId,
      // 用户来源
      // 0: 点击链接、地址栏输入、表单提交、脚本操作等。
      // 1: 点击重新加载按钮、location.reload。
      // 2: 点击前进或后退按钮。
      // 255: 任何其他来源。即非刷新/ 非前进后退、非点击链接 / 地址栏输入 / 表单提交 / 脚本操作等。
    }
  }

  /**
   * 处理每次添加并且触发发送
   * @param {(MetricsName | string)} key
   * @memberof SendLog
   */
  handlerCommon() {
    // console.log('触发')
  }

  /**
   * 处理发送
   * @private
   * @memberof SendLog
   */
  private handleRoutineReport() {}

  /**
   * 批量发送
   * @private
   * @param {IMetrics[]} list
   * @memberof SendLog
   */
  private sendMultiLog = (list: IMetrics[]) => {
    const mapped = list.map((item) => {
      const { category, ...data } = item
      const params = {
        ...data,
        category,
      }
      return params
    })

    const params = {
      logs: mapped,
    }

    if (typeof navigator.sendBeacon === 'function') {
      try {
        const isSuccess = window.navigator?.sendBeacon(this.url, CircularJSON.stringify(params))
        !isSuccess && this.xmlTransport(params)
      } catch (error) {
        this.xmlTransport(params)
      }
    } else {
      this.xmlTransport(params)
    }
  }

  /**
   * oXMLHttpRequest 上报
   * @memberof SendLog
   */
  xmlTransport = (params: IMetrics) => {
    const xhr = new (window as any).oXMLHttpRequest()
    xhr.open('POST', this.url, true)
    xhr.send(CircularJSON.stringify(params))
  }
}

export default new SendLog()
