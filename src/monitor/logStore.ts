import { BehaviorItem, IMetrics, TransportCategory } from './interfaces/util.interface'
import localForage from 'localforage'
import { getCookie, proxyHash, proxyHistory, wrHistory } from './utils'
import { v4 as uuidv4 } from 'uuid'
import { ConfigProps } from './interfaces/config.interface'

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
  // 缓存key
  private behaviorStoreKey: string = 'behaviorStoreKey'
  // 缓存key
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
    // 如果是刷新页面还是使用来的traceId，唯一的id， 可以查看用户进入流程
    const traceId = sessionStorage.getItem('traceId')
    // 做了简单的判断
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
  setConfig = (config: ConfigProps) => {
    this.config = config
    this.url = this.config.url + '/api/log/multi'
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
    this.logList.unshift({
      lang: language.substr(0, 2),
      winScreen: `${width}x${height}`,
      docScreen: `${document.documentElement.clientWidth || document.body.clientWidth}x${
        document.documentElement.clientHeight || document.body.clientHeight
      }`,
      userId: userId,
      traceId: this.traceId,
      mode: this.config.mode,
      category: TransportCategory.WebInfo,
    })
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
    this.logList.splice(1, 0, {
      path: pathname,
      referrer: document.referrer,
      prevHref: this.prevHref,
      title: document.title,
      href,
      jumpType: e?.type || '',
      type: performance?.navigation?.type,
      pageId: this.pageId,
      category: TransportCategory.PageInfo,
      traceId: this.traceId,
      // 用户来源
      // 0: 点击链接、地址栏输入、表单提交、脚本操作等。
      // 1: 点击重新加载按钮、location.reload。
      // 2: 点击前进或后退按钮。
      // 255: 任何其他来源。即非刷新/ 非前进后退、非点击链接 / 地址栏输入 / 表单提交 / 脚本操作等。
    })
  }

  /**
   * 初始化用户行为缓存
   * @memberof LogStore
   */
  initStore = async () => {
    // 此处要规避先后问题, 导致获取缓存数据前，就有上报数据 然后调用getLog方法，导致数据顺序不一致问题。
    await Promise.all([
      store.getItem(this.behaviorStoreKey).then((value) => {
        if (value) {
          const list = (value || []) as BehaviorItem[]
          this.behaviorList = [...list, ...this.behaviorList]
        }
        return true
      }),
      store.getItem(this.logsStoreKey).then((value) => {
        if (value) {
          const list = (value || []) as BehaviorItem[]
          // 确保这里添加数组开始
          this.logList = [...list, ...this.logList]
        }
        return true
      }),
    ])
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
    this.logList.push({
      ...value,
      pageId: this.pageId,
      traceId: this.traceId,
    })
    this.handlerCommon()
  }

  /**
   * 获取日志并删除已上报的数据
   * @memberof LogStore
   */
  getLog = (): IMetrics[] => {
    const logs: IMetrics[] = []
    const list = this.logList.filter((item, index: number) => {
      if (index < this.len) {
        logs.push({ ...item, siteId: this.config.appKey })
      }
      return index >= this.len
    })
    this.logList = [...list]
    return logs
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
      this.behaviorList.shift() // 删除数组第一个元素
      this.behaviorList.push(value) // 添加最新元素
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
