import { BehaviorItem, IMetrics, TransportCategory } from './interfaces/util.interface'
import localForage from 'localforage'
import { getCookie, proxyHash, proxyHistory, wrHistory } from './utils'
import { v4 as uuidv4 } from 'uuid'
import { ConfigProps } from './interfaces/config.interface'
import { omitEmpty } from './compactLog'

const store = localForage.createInstance({
  name: 'behaviorLog',
})

// 排除不需要记录在用户行为里面的key
const noList = [TransportCategory.PREF, TransportCategory.RV]

/**
 * 存储常规上报数据
 * @export
 * @class MetricsStore 抽象类-抽象方法
 */
export default abstract class LogStore {
  // 用于存储日志, 按照先后顺序存储在数组中。优先上报数组开头
  protected logList: IMetrics[] = []
  // 用于存储用户行为
  private behaviorList: BehaviorItem[] = []
  // 缓存behavior key
  private behaviorStoreKey: string = 'behaviorStoreKey'
  // 缓存logskey
  private logsStoreKey: string = 'logsStoreKey'
  // 配置信息
  public config!: ConfigProps
  // 上报url
  protected url!: string
  // 当前页面路径
  private curHref!: string
  // 上个页面路径
  private prevHref!: string
  // 每次页面发生变化都会重新生成一个pageId,可以根据这个pageId统计每个页面的操作
  private pageId!: string
  // 每次初始化都会产生一个，方便用于查询用户交互、操作流程，这个可以处理成流程图查看用户操作过程。
  public traceId!: string
  // 当前日志上报是否发生完成
  public isOver: boolean = false
  // 每次上传的个数
  protected len: number = 10
  // 存储最大用户行为数
  protected maxBehaviorLen = 200

  constructor() {
    wrHistory()
    this.getInit()
    this.initStore()
    this.initRouterChange()
  }

  /**
   * 初始化生成traceId
   * @memberof SendLog
   */
  getInit() {
    // 如果是刷新页面还是使用原来来的traceId，唯一的id， 可以查看用户进入流程
    const traceId = sessionStorage.getItem('traceId')
    // 做了简单的判断, 如果traceId长度大于40，则认为是正常的traceId
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
    // 记录上一次的路径,用于对比是否发生变化
    let lastPathname = ''
    // 统一的路由变化处理函数
    const handleRouteChange = (event: Event) => {
      const currentPathname = window.location.pathname
      // 只在路径发生变化时触发
      if (currentPathname === lastPathname) {
        return
      }
      // 更新lastPathname并记录动态信息
      lastPathname = currentPathname
      this.dynamicInfo(event)
    }
    // 监听页面显示事件,包括页面加载和从bfcache恢复
    window.addEventListener('pageshow', handleRouteChange, { capture: true })
    // 监听hash路由变化
    proxyHash(handleRouteChange)
    // 监听history路由变化
    proxyHistory(handleRouteChange)
  }

  /**
   * 统一注入单条日志级公共字段（pageId/timestamp）。
   * - 仅在此处集中处理，避免各采集模块各自拼装导致字段重复或不一致。
   * - siteId、traceId 在一次批量上报内恒定，已提升到批量外层（见 SendLog.sendMultiLog），单条日志不再携带。
   * - 调用方已显式传入的字段优先级最高，防止被默认值覆盖。
   * - pageId 缺省时不写入 undefined，避免产生无意义字段（如 webInfo 无 pageId）。
   * @param {IMetrics} value
   * @return {IMetrics}
   * @memberof LogStore
   */
  protected mergeCommonFields = (value: IMetrics): IMetrics => {
    const merged: IMetrics = {
      pageId: this.pageId,
      timestamp: Date.now(),
      ...value,
    }
    if (merged.pageId === undefined) {
      delete merged.pageId
    }
    return omitEmpty(merged)
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
    const pageInfo = this.mergeCommonFields({
      path: pathname,
      referrer: document.referrer,
      prevHref: this.prevHref,
      title: document.title,
      href,
      jumpType: e?.type || '',
      type: performance?.navigation?.type,
      category: TransportCategory.PageInfo,
      // 用户来源
      // 0: 点击链接、地址栏输入、表单提交、脚本操作等。
      // 1: 点击重新加载按钮、location.reload。
      // 2: 点击前进或后退按钮。
      // 255: 任何其他来源。即非刷新/ 非前进后退、非点击链接 / 地址栏输入 / 表单提交 / 脚本操作等。
    })
    const webInfoIndex = this.logList.findIndex((item) => item.category === TransportCategory.WebInfo)
    if (webInfoIndex >= 0) {
      this.logList.splice(webInfoIndex + 1, 0, pageInfo)
    } else {
      this.logList.unshift(pageInfo)
    }
    this.persistLogs()
    this.handlerCommon()
  }

  /**
   * 配置设置
   * @param {ConfigProps} config
   * @memberof SendLog
   */
  setConfig = (config: ConfigProps) => {
    this.config = config
    this.url = this.config.url + '/api/log/multi'
    if (typeof config.maxBehaviorRecords === 'number' && config.maxBehaviorRecords > 0) {
      this.maxBehaviorLen = config.maxBehaviorRecords
    }
    this.initPageInfo()
  }

  /**
   * 初始化获取页面信息, 页面信息只有在初始化时获取，其他都不需要更新
   * @memberof SendLog
   */
  initPageInfo = () => {
    const userId = getCookie('userId')
    const { width, height } = window.screen
    const { language } = navigator
    // 网页基础信息，一般都不会变，Redis 存储 3 天
    this.logList.unshift(
      this.mergeCommonFields({
        lang: language.slice(0, 2),
        winScreen: `${width}x${height}`,
        docScreen: `${document.documentElement.clientWidth || document.body.clientWidth}x${
          document.documentElement.clientHeight || document.body.clientHeight
        }`,
        userId: userId,
        mode: this.config.mode,
        category: TransportCategory.WebInfo,
      }),
    )
    this.persistLogs()
  }

  /**
   * 初始化用户行为缓存
   * @memberof LogStore
   */
  initStore = async () => {
    // 此处要规避先后问题, 导致获取缓存数据前，就有上报数据 然后调用 peekLog，导致数据顺序不一致问题。
    await Promise.all([
      store.getItem(this.behaviorStoreKey).then((value) => {
        if (value) {
          const list = (value || []) as BehaviorItem[]
          if (Array.isArray(list)) {
            this.behaviorList = [...list, ...this.behaviorList]
          }
        }
        return true
      }),
      store.getItem(this.logsStoreKey).then((value) => {
        if (value) {
          const restored = this.restoreLogs(value)
          // 确保这里添加数组开始
          this.logList = [...restored, ...this.logList]
        }
        return true
      }),
    ])
    this.persistLogs()
    this.isOver = true
    this.handlerCommon()
  }

  /**
   * 添加日志
   * @param {IMetrics} value
   * @memberof LogStore
   */
  add = (value: IMetrics): void => {
    // 排除不能作为用户行为的数据
    if (!noList.includes(value.category) && !!value.monitorId) {
      this.push({
        type: value.category,
        monitorId: value.monitorId,
      })
    }
    this.logList.push(this.mergeCommonFields(value))
    this.persistLogs()
    this.handlerCommon()
  }

  /**
   * 还原本地缓存的未上报日志。
   * traceId 已提到批量外层，单条日志默认不携带；但缓存可能跨会话恢复，
   * 若缓存所属会话与当前会话不同，则为这些历史日志逐条补回原会话的 traceId，
   * 避免被本次批量外层的当前 traceId 误归并。
   * @param {unknown} value 缓存值
   * @return {IMetrics[]}
   * @memberof LogStore
   */
  private restoreLogs = (value: unknown): IMetrics[] => {
    // 兼容旧版本数组格式
    if (Array.isArray(value)) {
      return value as IMetrics[]
    }
    const cache = value as { traceId?: string; logs?: IMetrics[] }
    const logs = Array.isArray(cache?.logs) ? cache.logs : []
    if (cache?.traceId && cache.traceId !== this.traceId) {
      return logs.map((item) => ({ traceId: cache.traceId, ...item }))
    }
    return logs
  }

  /**
   * 查看待上报日志，不移出队列。发送成功后再 ackLog。
   * @memberof LogStore
   */
  peekLog = (): IMetrics[] => {
    if (!navigator.onLine) {
      return []
    }
    return this.logList.slice(0, this.len)
  }

  /**
   * 发送成功后删除队头并落盘。失败不得调用，避免丢数。
   * @param {number} count
   * @memberof LogStore
   */
  ackLog = (count: number): void => {
    if (count <= 0) return
    this.logList = this.logList.slice(count)
    this.persistLogs()
  }

  /**
   * 队列落盘，关页前也能从 IndexedDB 恢复未确认日志。
   * @memberof LogStore
   */
  protected persistLogs = (): void => {
    store.setItem(this.logsStoreKey, { traceId: this.traceId, logs: this.logList })
  }

  /**
   * 添加用户行为
   * @param {BehaviorItem} value
   * @memberof LogStore
   */
  push(value: BehaviorItem) {
    if (this.behaviorList.length < this.maxBehaviorLen) {
      this.behaviorList.push(value)
    } else {
      // 如果大于200，删除到199个
      while (this.behaviorList.length >= this.maxBehaviorLen) {
        this.behaviorList.shift()
      }
      this.behaviorList.push(value)
    }
    store.setItem(this.behaviorStoreKey, this.behaviorList)
  }

  /**
   * 获取所有的行为数据
   * @return {*}
   * @memberof LogStore
   */
  getList(): BehaviorItem[] {
    return this.behaviorList
  }

  /**
   * 处理通用逻辑，抽象类的抽象方法
   * @param {(MetricsName | string)} key
   * @memberof MetricsStore
   */
  abstract handlerCommon(): void
}
