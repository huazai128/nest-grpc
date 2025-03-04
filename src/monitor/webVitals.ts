/* eslint-disable @typescript-eslint/no-unused-vars */
import { IMetrics, MetricsName, ResourceFlowTiming, TransportCategory } from './interfaces/util.interface'
import {
  afterLoad,
  getFCP,
  getFP,
  getNavigationTiming,
  getPerformanceResourceFlow,
  getResourceFlow,
  mOberver,
  normalizePerformanceRecord,
  supported,
} from './utils'
import { CommonExtends } from './commonExtends'

/**
 * WebVitals 类 - 用于监控网页性能指标
 * 继承自 CommonExtends 基类
 * 主要监控以下指标:
 * - FP (First Paint) - 首次绘制
 * - FCP (First Contentful Paint) - 首次内容绘制
 * - FMP (First Meaningful Paint) - 首次有意义绘制
 * - Navigation Timing - 导航计时
 * - Resource Flow - 资源加载流
 */
export class WebVitals extends CommonExtends {
  // 记录页面加载开始时间
  private readonly startTime: number
  // 记录 FCP 与实际时间的差值
  private diffTime: number = 0

  /**
   * 构造函数 - 初始化性能监控
   * 记录开始时间并启动所有监控指标
   */
  constructor() {
    super()
    this.startTime = performance.now()
    this.initMetrics()
  }

  /**
   * 初始化所有性能指标监控
   * 按顺序启动各项指标的监控
   */
  private initMetrics(): void {
    this.initResourceFlow()
    this.initFCP()
    this.initFP()
    this.initFMP()
    afterLoad(() => this.initNavigationTiming())
  }

  /**
   * 发送性能指标日志
   * @param metrics - 性能指标数据
   * @param type - 指标类型
   */
  private sendMetricsLog(metrics: Partial<IMetrics>, type: MetricsName): void {
    try {
      this.sendLog.add({
        ...metrics,
        reportsType: type,
        category: TransportCategory.PREF,
      })
    } catch (error) {
      console.error(`Failed to send ${type} metrics:`, error)
    }
  }

  /**
   * 初始化首次绘制(FP)监控
   * FP 标记了浏览器首次将像素渲染到屏幕的时间点
   */
  private async initFP(): Promise<void> {
    try {
      const entry = await getFP()
      if (entry) {
        const { name, ...metrics } = normalizePerformanceRecord(entry)
        this.sendMetricsLog({ fpTime: metrics }, MetricsName.FP)
      }
    } catch (error) {
      console.error('Failed to initialize FP:', error)
    }
  }

  /**
   * 初始化首次内容绘制(FCP)监控
   * FCP 标记了浏览器首次渲染任何文本、图像、非空白 canvas 或 SVG 的时间点
   */
  private async initFCP(): Promise<void> {
    try {
      const entry = (await getFCP()) as IMetrics
      if (entry) {
        const time = performance.now() - this.startTime
        this.diffTime = Number((entry.startTime - time).toFixed(2))
        const { name, ...metrics } = normalizePerformanceRecord(entry)
        this.sendMetricsLog({ fcpTime: metrics }, MetricsName.FCP)
      }
    } catch (error) {
      console.error('Failed to initialize FCP:', error)
    }
  }

  /**
   * 初始化首次有意义绘制(FMP)监控
   * FMP 标记了页面主要内容出现在屏幕上的时间点
   * 使用 IntersectionObserver 检测元素可见性
   */
  private initFMP(): void {
    try {
      let isOnce = false
      const iOb = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !isOnce) {
              const fmpTime = performance.now() - this.startTime + this.diffTime
              this.sendMetricsLog({ fmpTime }, MetricsName.FMP)
              isOnce = true
              iOb.disconnect()
              break
            }
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: [0.1, 0.85],
        },
      )

      const mO = mOberver((mutation: MutationRecord) => {
        const addedNodes = mutation.addedNodes
        for (const node of addedNodes) {
          if (node instanceof HTMLElement) {
            iOb.observe(node)
            mO.disconnect()
            break
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize FMP:', error)
    }
  }

  /**
   * 初始化导航计时监控
   * 收集页面加载过程中的各种时间戳
   */
  private initNavigationTiming(): void {
    try {
      const navigationTiming = getNavigationTiming() as IMetrics
      this.sendMetricsLog({ ntTiming: navigationTiming }, MetricsName.NT)
    } catch (error) {
      console.error('Failed to initialize Navigation Timing:', error)
    }
  }

  /**
   * 初始化资源加载流监控
   * 监控页面资源(脚本、样式表、图片等)的加载性能
   * 计算资源缓存命中率
   */
  private initResourceFlow(): void {
    if (!supported.performance) return

    try {
      const resourceFlow: Array<ResourceFlowTiming> = []
      const resObserve = getResourceFlow(resourceFlow)

      const stopListening = () => {
        resObserve?.disconnect()
        const metrics = getPerformanceResourceFlow() as Array<ResourceFlowTiming>
        const list = metrics.map((item) => normalizePerformanceRecord(item))
        const cacheQuantity = metrics.filter((item) => item.isCache).length

        this.sendMetricsLog(
          {
            resourcePrefs: list,
            cacheRate: ((cacheQuantity / metrics.length) * 100).toFixed(2),
          },
          MetricsName.RF,
        )
      }

      window.addEventListener('load', stopListening, { once: true, capture: true })
    } catch (error) {
      console.error('Failed to initialize Resource Flow:', error)
    }
  }
}
