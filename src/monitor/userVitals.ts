import { CommonExtends } from './commonExtends'
import { proxyFetch, proxyXmlHttp } from './httpProxy'
import { CustomAnalyticsData, FN1, HttpMetrics, MetricsName, TransportCategory } from './interfaces/util.interface'
import { downloadSpeed, mOberver, proxyHash, proxyHistory } from './utils'
import isHtml from 'is-html'
import { v4 as uuidv4 } from 'uuid'

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
  // 定义需要监听的事件类型
  private readonly events: Array<keyof WindowEventMap> = ['click', 'blur', 'touchend']

  /**
   * 构造函数 - 初始化监控器
   */
  constructor() {
    super()
    this.initializeHandlers()
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
   * 初始化路由变化监听
   * 当路由变化时触发 PV 统计和曝光检测
   */
  private initRouterChange = (): void => {
    const handler = (): void => {
      void this.initPV()
      this.initExposure()
    }
    window.addEventListener('pageshow', handler, { once: true, capture: true })
    proxyHash(handler)
    proxyHistory(handler)
  }

  /**
   * 初始化页面访问(PV)统计
   * 包含网络速度测试
   */
  private initPV = async (): Promise<void> => {
    try {
      const url = 'https://biu-cn.dwstatic.com/upload/1726199407972.jpg'
      const res = await downloadSpeed({ url, size: 103.13 })
      const monitorId = `${TransportCategory.PV}${uuidv4()}`

      this.sendLog.add({
        reportsType: MetricsName.RCR,
        category: TransportCategory.PV,
        monitorId,
        ...res,
      })
    } catch (error) {
      console.error('Failed to initialize PV:', error)
    }
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
      this.sendLog.add(eventData)
    }

    this.events.forEach((event) => {
      window.addEventListener(event, handle as EventListener)
    })
  }

  /**
   * 验证目标元素是否需要被监听
   */
  private isValidTarget(tagName: string | undefined): boolean {
    return Boolean(tagName && !['body', 'html'].includes(tagName))
  }

  /**
   * 构建事件数据对象
   */
  private buildEventData(target: HTMLElement, event: Event): Record<string, unknown> {
    const data = target.dataset || {}
    const classNames = target.classList?.value || ''
    const id = target.id ? ` id="${target.id}"` : ''
    const innerText = target.innerText
    const value = (target as HTMLInputElement).value

    const nodeDom = value
      ? `<${target.tagName.toLowerCase()} ${id} ${classNames}>${innerText} ${value && event.type === 'blur' ? '输入框值为：' + value : ''}</${target.tagName.toLowerCase()}>`
      : null

    return {
      reportsType: MetricsName.CBR,
      nodeId: target.id,
      classList: Array.from(target.classList),
      tagName: target.tagName.toLowerCase(),
      tagText: innerText || target.textContent,
      category: TransportCategory.EVENT,
      nodeDom,
      monitorId: `${TransportCategory.EVENT}${uuidv4()}`,
      ...data,
    }
  }

  /**
   * 初始化元素曝光监控
   */
  private initExposure = (): void => {
    const observer = this.createIntersectionObserver()
    this.observeVisibleElements(observer)
    this.observeDOMChanges(observer)
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
   * 处理元素可见性变化
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
        ...data,
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
  private observeDOMChanges(observer: IntersectionObserver): void {
    mOberver((mutation: MutationRecord) => {
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

      this.sendLog.add({
        reportsType: MetricsName.HT,
        category: TransportCategory.API,
        monitorId,
        ...metrics,
        response,
      })
    }

    proxyXmlHttp(null, handler)
    proxyFetch(null, handler)
  }

  /**
   * 格式化响应数据
   */
  private formatResponse(response: unknown): unknown {
    return typeof response === 'string' && isHtml(response) ? '[-Body内容为HTML已过滤-]' : response
  }
}
