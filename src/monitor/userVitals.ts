import { CommonExtends } from './commonExtends'
import { proxyFetch, proxyXmlHttp } from './httpProxy'
import { CustomAnalyticsData, FN1, HttpMetrics, MetricsName, TransportCategory } from './interfaces/util.interface'
import 'reflect-metadata'
import { mOberver } from './utils'
import isHtml from 'is-html'
import { onTTFB } from 'web-vitals'

/**
 * 监听用户行为
 * @export
 * @class UserVitals
 */
export class UserVitals extends CommonExtends {
  private events: Array<string> = ['click', 'touchstart', 'blur', 'touchend']
  constructor() {
    super()
    this.initClickHandler()
    this.initHttpHandler()
  }

  /**
   * 上报pv
   * @memberof UserVitals
   */
  initPV = () => {
    // const { pathname, href } = window.location
    const metrice = {
      reportsType: MetricsName.RCR,
      category: TransportCategory.PV,
    }
    this.sendLog.add(MetricsName.RCR, metrice)

    // this.behaviorTracking.push({ ...metrice, path: pathname, href })
  }

  /**
   * 点击、输入失去焦点、触发相关事件
   * @memberof UserVitals
   */
  initClickHandler = () => {
    const handle = (e: MouseEvent | any) => {
      const target = e.target
      const tagName = target.tagName?.toLowerCase()
      if (tagName === 'body' || tagName === 'html' || !tagName) {
        return null
      }
      const data = target.dataset || {} // 点击事件上报参数
      const classNames = target.classList?.value
      const id = target.id ? ` id="${target.id}"` : ''
      const innerText = target.innerText
      const value = target.value
      // 获取包含id、class、innerTextde字符串的标签
      const nodeDom = `<${tagName} ${id} ${classNames !== '' ? classNames : ''}>${innerText} ${!!value ? '输入框值为：' + value : null}</${tagName}>`
      const metrice = {
        reportsType: MetricsName.CBR,
        nodeId: target.id,
        classList: Array.from(target.classList),
        tagName: tagName,
        tagText: innerText || target.textContent,
        category: TransportCategory.EVENT,
        nodeDom: nodeDom,
        ...data,
      }
      // 只有标签节点上添加上报参数，data-logId=""才会上报
      if (data.logId) {
        this.sendLog.add(MetricsName.CBR, metrice)
      }
    }
    this.events.forEach((event) => {
      window.addEventListener(event, handle, true)
    })
  }

  /**
   * 曝光上报
   * @memberof UserVitals
   */
  initExposure = () => {
    // 针对曝光监控
    const itOberser = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 检查元素发生了碰撞
          const nodeRef = entry.target as HTMLElement
          const att = nodeRef.getAttribute('data-visible')
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55 && !att) {
            const data: any = nodeRef.dataset || {} // 曝光埋点日志数据
            const metrice = {
              reportsType: MetricsName.CE,
              classList: Array.from(nodeRef.classList),
              tagName: nodeRef.tagName,
              text: nodeRef.textContent,
              category: TransportCategory.EVENT,
              ...data,
            }
            this.sendLog.add(MetricsName.CE, metrice)
            // 曝光不是用户行为，可以不作为采集信息
            nodeRef.setAttribute('data-visible', 'y')
          }
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0.1, 0.55],
      },
    )

    // 在class 元素上添加 on-visible  用于监听曝光
    const nodes = (document as Document).querySelectorAll('.on-visible')
    nodes.forEach((child) => {
      itOberser?.observe(child)
    })

    mOberver(function (mutation: MutationRecord) {
      const addedNodes = mutation.addedNodes
      if (!!addedNodes.length) {
        try {
          addedNodes?.forEach((node: any) => {
            if (node instanceof HTMLElement) {
              const isS = node.classList?.contains('on-visible')
              isS && itOberser.observe(node)
              const nodes = node?.querySelectorAll?.('.on-visible') as unknown as Array<HTMLElement>
              nodes?.forEach((child: HTMLElement) => {
                itOberser.observe(child)
              })
            }
          })
        } catch (error) {
          console.log(error)
        }
      }
    })
  }

  /**
   * 用户自定义埋点
   * @memberof UserVitals
   */
  initCustomerHandler = (): FN1 => {
    return (options: CustomAnalyticsData) => {
      const metrice = {
        reportsType: MetricsName.CDR,
        category: TransportCategory.CUSTOM,
        ...options,
      }
      this.sendLog.add(MetricsName.CDR, metrice)
      // 记录到用户行为追踪队列
      // this.behaviorTracking.push(metrice)
    }
  }

  /**
   * http请求上报
   * @memberof UserVitals
   */
  initHttpHandler = (): void => {
    const handler = (metrics: HttpMetrics) => {
      onTTFB(console.log)
      const metrice = {
        reportsType: MetricsName.HT,
        category: TransportCategory.API,
        ...metrics,
        body: typeof metrics.body === 'string' && isHtml(metrics.body) ? '[-Body内容为HTML已过滤-]' : metrics.body,
      }
      this.sendLog.add(MetricsName.HT, metrice)
      // 记录到用户行为追踪队列
    }
    proxyXmlHttp(null, handler)
    proxyFetch(null, handler)
  }
}
