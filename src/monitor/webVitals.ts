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
import { SendLog } from './sendLog'
import { CommonExtends } from './commonExtends'

/**
 * 监听 web 性能
 * @export
 * @class webVitals
 */
export class WebVitals extends CommonExtends {
  private startTime: number
  private diffTime!: number
  constructor() {
    super()
    this.startTime = Date.now()
    this.initResourceFlow()
    this.initFMP()
    afterLoad(() => {
      this.initFCP()
      this.initFP()
      this.initNavigationTiming()
    })
  }
  /**
   * 白屏
   * @memberof WebVitals
   */
  private async initFP() {
    try {
      const entry = await getFP()
      if (entry) {
        const { name, ...metrics } = normalizePerformanceRecord(entry)
        this.sendLog.set(MetricsName.FP, {
          ...metrics,
          reportsType: MetricsName.FP,
          category: TransportCategory.PREF,
        })
      }
    } catch (error) {}
  }

  /**
   * 灰屏
   * @memberof WebVitals
   */
  private async initFCP() {
    try {
      const entry = (await getFCP()) as IMetrics
      const time = Date.now() - this.startTime
      if (entry) {
        this.diffTime = Number((entry.startTime - time).toFixed(2))
        const { name, ...metrics } = normalizePerformanceRecord(entry)
        this.sendLog.set(MetricsName.FCP, {
          ...metrics,
          reportsType: MetricsName.FCP,
          category: TransportCategory.PREF,
        })
      }
    } catch (error) {}
  }

  /**
   * 首次有效绘制
   * @memberof WebVitals
   */
  private initFMP() {
    try {
      let isOnce = false
      const time = this.startTime
      const iOb = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              if (!isOnce) {
                const t = Date.now() - time + this.diffTime
                this.sendLog.set(MetricsName.FMP, {
                  fmpTime: t,
                  reportsType: MetricsName.FMP,
                  category: TransportCategory.PREF,
                })
                isOnce = true
              }
            }
          })
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: [0.1, 0.85],
        },
      )
      const mO = mOberver(function (mutation: MutationRecord) {
        const addedNodes = mutation.addedNodes
        addedNodes?.forEach((node: any) => {
          if (node instanceof HTMLElement) {
            iOb.observe(node)
            mO.disconnect()
          }
        })
      })
    } catch (error) {}
  }

  /**
   * 初始化 timing
   * @memberof WebVitals
   */
  private initNavigationTiming() {
    try {
      const navigationTiming = getNavigationTiming()
      const metrics = navigationTiming as IMetrics
      this.sendLog.set(MetricsName.NT, { ...metrics, reportsType: MetricsName.NT, category: TransportCategory.PREF })
    } catch (error) {}
  }

  /**
   * 初始化 RF
   * @memberof WebVitals
   */
  private initResourceFlow() {
    if (supported.performance) {
      try {
        const resourceFlow: Array<ResourceFlowTiming> = []
        const resObserve = getResourceFlow(resourceFlow)
        const stopListening = () => {
          if (resObserve) {
            resObserve.disconnect()
          }
          const metrics = getPerformanceResourceFlow() as Array<ResourceFlowTiming>
          const list = metrics.map((item: IMetrics) => normalizePerformanceRecord(item))
          const cacheQuantity = metrics.filter((item) => item.isCache)?.length
          this.sendLog.set(MetricsName.RF, {
            resourcePrefs: list,
            reportsType: MetricsName.RF,
            category: TransportCategory.PREF,
            cacheRate: ((cacheQuantity / metrics.length) * 100).toFixed(2),
          })
        }
        // 当页面 pageshow 触发时，中止
        window.addEventListener('load', stopListening, { once: true, capture: true })
      } catch (error) {}
    }
  }
}
