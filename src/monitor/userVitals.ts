import { CommonExtends } from './commonExtends'
import { proxyFetch, proxyXmlHttp } from './httpProxy'
import { CustomAnalyticsData, FN1, HttpMetrics, MetricsName, TransportCategory } from './interfaces/util.interface'
import { downloadSpeed, mOberver } from './utils'
import isHtml from 'is-html'
import { v4 as uuidv4 } from 'uuid'
import { compactHttpMetrics, pickDataset } from './compactLog'
import { appendSessionStep, currentPagePath, shortUrl } from './sessionLog'

/**
 * UserVitals 类 - 用于监控用户行为
 * 继承自 CommonExtends 基类
 * 主要监控以下行为:
 * - 点击事件
 * - 输入框失去焦点事件
 * - 触摸结束事件
 * - 路由变化事件
 * - 页面加载事件
 */
export class UserVitals extends CommonExtends {
  /** 点击 / 失焦 / 触摸结束，用于采集节点信息和 dataset 自定义属性 */
  private readonly events: Array<keyof WindowEventMap> = ['click', 'blur', 'touchend']
  /** 当前页曝光观察器，路由切换时先断开再重建，避免重复上报 */
  private exposureObserver?: IntersectionObserver
  /** 监听 DOM 增删以给新的 `.on-visible` 节点补观察 */
  private exposureMutation?: MutationObserver

  /**
   * 构造函数 - 初始化监控器
   */
  constructor() {
    super()
    this.initializeHandlers()
    window.sendTracker = this.initCustomerHandler()
  }

  /**
   * 初始化所有事件处理器
   */
  private initializeHandlers(): void {
    this.initClickHandler()
    this.initHttpHandler()
    this.initRouterChange()
  }

  /**
   * 跟随 LogStore 页面生命周期：首屏 bootstrap 和后续路由都会触发 PV / 曝光。
   */
  private initRouterChange = (): void => {
    this.sendLog.subscribePageChange(() => {
      void this.initPV()
      if (this.sendLog.config?.isExposure !== false) {
        this.initExposure()
      }
    })
  }

  /**
   * 初始化页面访问(PV)统计
   * 包含网络速度测试
   */
  private initPV = async (): Promise<void> => {
    const monitorId = `${TransportCategory.PV}${uuidv4()}`
    let speed: Record<string, number> = {}
    try {
      const url = 'https://biu-cn.dwstatic.com/upload/1726199407972.jpg'
      speed = await downloadSpeed({ url, size: 103.13 })
    } catch (error) {
      console.error('Failed to measure PV network speed:', error)
    }
    this.sendLog.add({
      reportsType: MetricsName.RCR,
      category: TransportCategory.PV,
      monitorId,
      ...speed,
    })
  }

  /**
   * 初始化点击事件监听
   * 监听用户的点击、失焦和触摸事件
   */
  private initClickHandler = (): void => {
    const handle = (e: Event): void => {
      if (!(e.target instanceof HTMLElement)) return

      const target = e.target
      const tagName = target.tagName?.toLowerCase()

      if (!this.isValidTarget(tagName)) {
        return
      }

      const eventData = this.buildEventData(target, e)
      this.appendClickStep(target, e)
      this.sendLog.add(eventData)
    }

    this.events.forEach((event) => {
      window.addEventListener(event, handle as EventListener)
    })
  }

  /**
   * 验证目标元素是否需要被监听。忽略 body / html，避免整页点击刷屏。
   * @param {(string | undefined)} tagName
   * @return {boolean}
   */
  private isValidTarget(tagName: string | undefined): boolean {
    return Boolean(tagName && !['body', 'html'].includes(tagName))
  }

  /**
   * 构建点击 / 失焦 / 触摸事件数据。
   * nodeDom 仅在输入框 blur 时带输入值；dataset 不会覆盖 category 等保留键。
   * @param {HTMLElement} target
   * @param {Event} event
   */
  private buildEventData(target: HTMLElement, event: Event): Record<string, unknown> {
    const data = target.dataset || {}
    const classNames = target.classList?.value || ''
    const id = target.id ? ` id="${target.id}"` : ''
    const innerText = target.innerText
    const value = (target as HTMLInputElement).value

    const nodeDom =
      value && event.type === 'blur'
        ? `<${target.tagName.toLowerCase()} ${id} ${classNames}>${innerText} 输入框值为：${value}</${target.tagName.toLowerCase()}>`
        : undefined

    return {
      reportsType: MetricsName.CBR,
      nodeId: target.id,
      classList: Array.from(target.classList),
      tagName: target.tagName.toLowerCase(),
      tagText: innerText || target.textContent,
      category: TransportCategory.EVENT,
      nodeDom,
      monitorId: `${TransportCategory.EVENT}${uuidv4()}`,
      ...pickDataset(data),
    }
  }

  /**
   * 初始化元素曝光监控
   */
  private initExposure = (): void => {
    this.exposureObserver?.disconnect()
    this.exposureMutation?.disconnect()
    const observer = this.createIntersectionObserver()
    this.exposureObserver = observer
    this.observeVisibleElements(observer)
    this.exposureMutation = this.observeDOMChanges(observer)
  }

  /**
   * 创建交叉观察器实例
   */
  private createIntersectionObserver(): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => this.handleIntersection(entry))
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0.1, 0.55],
      },
    )
  }

  /**
   * 可见比例达到 0.55 且未标记 data-visible 时上报一次曝光。
   * @param {IntersectionObserverEntry} entry
   */
  private handleIntersection(entry: IntersectionObserverEntry): void {
    const nodeRef = entry.target as HTMLElement
    const att = nodeRef.getAttribute('data-visible')

    if (entry.isIntersecting && entry.intersectionRatio >= 0.55 && !att) {
      const data = nodeRef.dataset || {}

      this.sendLog.add({
        reportsType: MetricsName.CE,
        classList: Array.from(nodeRef.classList),
        tagName: nodeRef.tagName,
        text: nodeRef.textContent,
        category: TransportCategory.EVENT,
        ...pickDataset(data),
        monitorId: (data as Record<string, string>).monitorId || `${TransportCategory.EVENT}${uuidv4()}`,
      })

      nodeRef.setAttribute('data-visible', 'y')
    }
  }

  /**
   * 观察可见元素
   */
  private observeVisibleElements(observer: IntersectionObserver): void {
    const nodes = document.querySelectorAll('.on-visible')
    nodes.forEach((node) => observer.observe(node))
  }

  /**
   * 观察 DOM 变化
   */
  private observeDOMChanges(observer: IntersectionObserver): MutationObserver {
    return mOberver((mutation: MutationRecord) => {
      if (mutation.addedNodes.length) {
        this.handleAddedNodes(mutation.addedNodes, observer)
      }
    })
  }

  /**
   * 处理新增的 DOM 节点
   */
  private handleAddedNodes(nodes: NodeList, observer: IntersectionObserver): void {
    try {
      nodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.classList?.contains('on-visible')) {
            observer.observe(node)
          }

          const visibleChildren = node.querySelectorAll('.on-visible')
          visibleChildren.forEach((child) => observer.observe(child))
        }
      })
    } catch (error) {
      console.error('Error handling added nodes:', error)
    }
  }

  /**
   * 初始化自定义埋点处理器
   */
  public initCustomerHandler = (): FN1 => {
    return (options: CustomAnalyticsData): void => {
      const monitorId = `${TransportCategory.CUSTOM}${uuidv4()}`

      appendSessionStep('custom', `自定义埋点 ${options.eventAction || ''} ${options.eventLabel || ''}`.trim(), [
        `页面: ${currentPagePath()}`,
        options.eventCategory ? `类别: ${options.eventCategory}` : '',
        options.eventValue ? `取值: ${options.eventValue}` : '',
      ])
      this.sendLog.add({
        reportsType: MetricsName.CDR,
        category: TransportCategory.CUSTOM,
        monitorId,
        ...options,
      })
    }
  }

  /**
   * 初始化 HTTP 请求监控
   */
  private initHttpHandler = (): void => {
    const handler = (metrics: HttpMetrics): void => {
      const monitorId = `${TransportCategory.API}${uuidv4()}`
      const response = this.formatResponse(metrics.response)
      if (!this.isMonitorReportUrl(metrics.queryUrl)) {
        const cost = Math.max(0, Number(metrics.responseTime || 0) - Number(metrics.requestTime || 0))
        appendSessionStep('http', `${metrics.method || 'GET'} ${shortUrl(metrics.queryUrl)} → ${metrics.status}`, [
          `页面: ${currentPagePath()}`,
          metrics.statusText ? `状态: ${metrics.statusText}` : '',
          cost ? `耗时: ${cost}ms` : '',
        ])
      }

      this.sendLog.add({
        reportsType: MetricsName.HT,
        category: TransportCategory.API,
        monitorId,
        ...compactHttpMetrics(metrics, response),
      })
    }

    proxyXmlHttp(null, handler)
    proxyFetch(null, handler)
  }

  /**
   * HTML 响应用占位符替换，避免把整页 DOM 写入接口日志。
   * @param {unknown} response
   */
  private formatResponse(response: unknown): unknown {
    return typeof response === 'string' && isHtml(response) ? '[-Body内容为HTML已过滤-]' : response
  }

  /**
   * 点击 / 失焦 / 触摸写入会话 .log，不单独上报这份文本。
   * @param {HTMLElement} target
   * @param {Event} event
   */
  private appendClickStep(target: HTMLElement, event: Event): void {
    const tag = target.tagName.toLowerCase()
    const id = target.id ? `#${target.id}` : ''
    const text = (target.innerText || target.textContent || '').trim().slice(0, 80)
    const value = (target as HTMLInputElement).value
    const action = event.type === 'blur' ? 'blur' : event.type === 'touchend' ? 'touchend' : 'click'
    const verb = action === 'blur' ? '输入框失焦' : action === 'touchend' ? '触摸结束' : '点击'
    const title = text ? `${verb} ${tag}${id}「${text}」` : `${verb} ${tag}${id || ''}`.trim()
    appendSessionStep(action, title, [
      `页面: ${currentPagePath()}`,
      target.className ? `样式: ${String(target.className).slice(0, 120)}` : '',
      action === 'blur' && value ? `输入值: ${String(value).slice(0, 120)}` : '',
    ])
  }

  /**
   * SDK 自己的上报请求不记入步骤，避免 .log 被监控流量刷屏。
   * @param {string} [url]
   * @return {boolean}
   */
  private isMonitorReportUrl(url?: string): boolean {
    const href = String(url || '')
    if (href.includes('/api/log/')) return true
    const reportUrl = this.sendLog.config?.url
    return Boolean(reportUrl && href.startsWith(reportUrl))
  }
}
