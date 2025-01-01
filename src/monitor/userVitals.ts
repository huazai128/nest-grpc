import { CommonExtends } from './commonExtends'
import { proxyFetch, proxyXmlHttp } from './httpProxy'
import { CustomAnalyticsData, FN1, HttpMetrics, MetricsName, TransportCategory } from './interfaces/util.interface'
import { downloadSpeed, mOberver, proxyHash, proxyHistory } from './utils'
import isHtml from 'is-html'
import { v4 as uuidv4 } from 'uuid'

/**
 * 监听用户行为
 * @export
 * @class UserVitals
 */
export class UserVitals extends CommonExtends {
  private events: Array<string> = ['click', 'blur', 'touchend']
  constructor() {
    super()
    this.initClickHandler()
    this.initHttpHandler()
    this.initRouterChange()
  }

  /**
   * 处理路由监听变化 初始化相关逻辑
   * @memberof UserVitals
   */
  initRouterChange = () => {
    const handler = () => {
      this.initPV()
      this.initExposure()
    }
    window.addEventListener('pageshow', handler, { once: true, capture: true })
    proxyHash(handler)
    proxyHistory(handler)
  }

  /**
   * 上报pv,在上报pv 时，会获取网络速度
   * @memberof UserVitals
   */
  initPV = async () => {
    const url = 'https://biu-cn.dwstatic.com/upload/1726199407972.jpg'
    const res = await downloadSpeed({ url, size: 103.13 })
    const monitorId = TransportCategory.PV + uuidv4()
    const metrice = {
      reportsType: MetricsName.RCR,
      category: TransportCategory.PV,
      monitorId: monitorId,
      ...res,
    }
    this.sendLog.add(metrice)
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
      const nodeDom = !!value
        ? `<${tagName} ${id} ${classNames !== '' ? classNames : ''}>${innerText} ${!!value && e.type === 'blur' ? '输入框值为：' + value : null}</${tagName}>`
        : null
      const monitorId = TransportCategory.EVENT + uuidv4()
      const metrice = {
        reportsType: MetricsName.CBR,
        nodeId: target.id,
        classList: Array.from(target.classList),
        tagName: tagName,
        tagText: innerText || target.textContent,
        category: TransportCategory.EVENT,
        nodeDom: nodeDom,
        monitorId,
        ...data,
      }
      this.sendLog.add(metrice)
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
            const monitorId = TransportCategory.EVENT + uuidv4()
            const metrice = {
              reportsType: MetricsName.CE,
              classList: Array.from(nodeRef.classList),
              tagName: nodeRef.tagName,
              text: nodeRef.textContent,
              category: TransportCategory.EVENT,
              monitorId,
              ...data,
            }
            this.sendLog.add(metrice)
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
    const nodes = (document as Document).querySelectorAll('.on-visible') || []
    nodes?.forEach((child) => {
      itOberser?.observe(child)
    })

    // 监听元素变化后，判断是否存在曝光买点
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
      const monitorId = TransportCategory.CUSTOM + uuidv4()
      const metrice = {
        reportsType: MetricsName.CDR,
        category: TransportCategory.CUSTOM,
        monitorId,
        ...options,
      }
      this.sendLog.add(metrice)
      // 记录到用户行为追踪队列
    }
  }

  /**
   * http请求上报
   * @memberof UserVitals
   */
  initHttpHandler = (): void => {
    const handler = (metrics: HttpMetrics) => {
      const monitorId = TransportCategory.API + uuidv4()
      const metrice = {
        reportsType: MetricsName.HT,
        category: TransportCategory.API,
        monitorId,
        ...metrics,
        response:
          typeof metrics.response === 'string' && isHtml(metrics.response)
            ? '[-Body内容为HTML已过滤-]'
            : metrics.response,
      }
      this.sendLog.add(metrice)
    }
    proxyXmlHttp(null, handler)
    proxyFetch(null, handler)
  }
}
