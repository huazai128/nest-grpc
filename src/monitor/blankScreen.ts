import { ExceptionMetrics, FN1, MechanismType } from './interfaces/util.interface'
import { getErrorUid } from './utils'

/**
 * 报错白屏采集。
 * 不是「页面空了就报」，而是：先记下页面级致命错误，再按网络质量等待，
 * 视口 5×5 采样空白 ≥ 88% 才走错误通道上报。弱网慢加载、骨架屏、接口失败都不算。
 */

/** 视口横向采样比例：覆盖左右边缘与中心，避免只打中局部骨架 */
const SAMPLE_XS = [0.1, 0.3, 0.5, 0.7, 0.9]
/** 视口纵向采样比例：与 SAMPLE_XS 组成 25 点网格 */
const SAMPLE_YS = [0.1, 0.3, 0.5, 0.7, 0.9]
/** 空白点占比达到该阈值才视为白屏（22/25） */
const EMPTY_RATIO = 0.88
/** 采样失败或仍在加载时的最大重试次数；成功上报仍靠 reportedPath 一页一次 */
const MAX_RETRY = 3
/** 记下致命错误后先等这一段，给 ErrorBoundary / 后续 chunk 恢复机会 */
const ERROR_SETTLE_MS = 1500
/** 从导航开始算起的最长等待；超时后不再因 stillLoading 推迟上报 */
const MAX_WAIT_MS = 25000

/** 只有这些标签时视为尚未渲染出业务内容 */
const WRAPPER_TAGS = new Set(['html', 'body'])
/** 常见应用挂载节点 id，空壳 #root / #app 等算空白 */
const WRAPPER_IDS = new Set(['root', 'app', 'app-root', '__next', '__nuxt'])

/** Network Information API 摘要，用来拉长弱网等待 */
type ConnectionInfo = {
  /** 有效网络类型，如 4g / 3g / 2g / slow-2g */
  effectiveType: string
  /** 预估 RTT（毫秒） */
  rtt: number
  /** 下行带宽估算（Mbps） */
  downlink: number
  /** 是否开启省流模式 */
  saveData: boolean
}

/** 白屏诱因：来自 errorSendHandler 的页面级错误摘要 */
type FatalErrorNote = {
  /** 错误机制，如 js / react / resource */
  reportsType: string
  /** 错误类型名，如 TypeError */
  errorType?: string
  /** 诱因错误指纹，拼进白屏 errorUid 便于关联 */
  errorUid: string
  /** 错误消息 */
  value?: string
  /** 资源错误时的标签名，仅 SCRIPT / LINK 视为关键资源 */
  resourceTag?: string
}

/** 白屏上报回调，走 ErrorVitals 错误通道以带上 breadcrumbs */
type BlankReporter = (metrics: ExceptionMetrics) => void

/** 上报函数，init 后才有值 */
let reporter: BlankReporter | undefined
/** 当前页最近一次致命错误；换页会清空 */
let lastFatal: FatalErrorNote | undefined
/** 已上报过白屏的 pathname，同一路径刷新前只报一次 */
let reportedPath = ''
/** 本页已重试采样次数 */
let retryCount = 0
/** 待执行的检测定时器，新的 schedule 会清掉旧的 */
let timer: number | undefined
/** 是否已绑定监听，避免重复 init */
let started = false

/**
 * 把「可能导致整页挂掉」的错误记为白屏诱因，并在 1.5s 后采样。
 * 过滤：白屏自身、HTTP、CORS、非 script/link 的资源失败。
 * @param {FatalErrorNote} note 已入队的错误摘要
 */
export function noteFatalError(note: FatalErrorNote): void {
  if (note.reportsType === MechanismType.BS) return
  if (note.reportsType === MechanismType.HP || note.reportsType === MechanismType.CS) return
  if (note.reportsType === MechanismType.RS && !isCriticalResource(note.resourceTag)) return
  lastFatal = note
  scheduleCheck(ERROR_SETTLE_MS)
}

/**
 * 启动白屏检测：订阅统一换页、可见性变化、load。
 * 换页会清空诱因和重试次数，避免把上一页的错误算到下一页。
 * @param {BlankReporter} report 走错误通道上报
 * @param {(handler: FN1) => void} [subscribePageChange] 与 pageInfo / PV 同一路页面切换
 */
export function initBlankScreen(report: BlankReporter, subscribePageChange?: (handler: FN1) => void): void {
  if (started || typeof window === 'undefined') return
  started = true
  reporter = report

  subscribePageChange?.(() => {
    lastFatal = undefined
    retryCount = 0
    scheduleCheck(getWaitMs())
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleCheck(ERROR_SETTLE_MS)
  })

  if (document.readyState === 'complete') {
    scheduleCheck(getWaitMs())
  } else {
    window.addEventListener('load', () => scheduleCheck(getWaitMs()), { once: true })
  }
}

/**
 * 资源错误是否足以导致整页空白。只有脚本和样式失败才算。
 * @param {string} [tag] 资源标签名
 * @return {boolean}
 */
function isCriticalResource(tag?: string): boolean {
  const type = String(tag || '').toUpperCase()
  return type === 'SCRIPT' || type === 'LINK'
}

/**
 * 读取 Network Information；接口不存在时返回空值，等待按默认 4s。
 * @return {ConnectionInfo}
 */
function getConnection(): ConnectionInfo {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; rtt?: number; downlink?: number; saveData?: boolean }
    mozConnection?: { effectiveType?: string; rtt?: number; downlink?: number; saveData?: boolean }
    webkitConnection?: { effectiveType?: string; rtt?: number; downlink?: number; saveData?: boolean }
  }
  const c = nav.connection || nav.mozConnection || nav.webkitConnection
  return {
    effectiveType: c?.effectiveType || '',
    rtt: Number(c?.rtt) || 0,
    downlink: Number(c?.downlink) || 0,
    saveData: !!c?.saveData,
  }
}

/**
 * 按网络质量计算检测延迟：省流/2g 18s，3g 或高 RTT 10s，否则 4s。
 * 只拉长等待，不能替代 lastFatal。
 * @return {number} 毫秒
 */
function getWaitMs(): number {
  const { effectiveType, rtt, downlink, saveData } = getConnection()
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') return 18000
  if (effectiveType === '3g' || rtt > 300 || (downlink > 0 && downlink < 1)) return 10000
  return 4000
}

/**
 * 距本次导航开始的已过时间，用于卡 MAX_WAIT_MS。
 * @return {number} 毫秒
 */
function elapsedMs(): number {
  const origin = Number(performance.timeOrigin) || performance.timing?.navigationStart || Date.now()
  return Date.now() - origin
}

/**
 * 是否已出现 first-contentful-paint。只写入上报文案，不是门闩。
 * @return {boolean}
 */
function hasFcp(): boolean {
  if (!performance.getEntriesByName) return false
  return performance.getEntriesByName('first-contentful-paint').length > 0
}

/**
 * 文档未 complete，或仍有 script/link/css 的 responseEnd 为 0，视为还在加载。
 * 加载中且未满 25s 只重试不报，避免把慢开页当白屏。
 * @return {boolean}
 */
function stillLoading(): boolean {
  if (document.readyState !== 'complete') return true
  if (!performance.getEntriesByType) return false
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  return entries.some((entry) => {
    const type = entry.initiatorType
    if (type !== 'script' && type !== 'link' && type !== 'css') return false
    return entry.responseEnd === 0
  })
}

/**
 * 采样点打到的节点是否算「没有业务内容」。
 * 空、html/body、挂载容器、无子节点且无文本的 div 视为空白。
 * @param {(Element | null)} el
 * @return {boolean}
 */
function isWrapper(el: Element | null): boolean {
  if (!el) return true
  const tag = el.tagName.toLowerCase()
  if (WRAPPER_TAGS.has(tag)) return true
  if (el.id && WRAPPER_IDS.has(el.id.toLowerCase())) return true
  const node = el as HTMLElement
  if (tag === 'div' && node.children.length === 0 && !node.innerText?.trim()) return true
  return false
}

/**
 * 在视口交叉点做 elementFromPoint。后台页或尺寸过小返回 total=0，由调用方重试。
 * @return {{ empty: number, total: number, wrappers: string[] }}
 */
function sampleViewport(): { empty: number; total: number; wrappers: string[] } {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w < 8 || h < 8 || document.visibilityState === 'hidden') {
    return { empty: 0, total: 0, wrappers: [] }
  }
  const wrappers = new Set<string>()
  let empty = 0
  const total = SAMPLE_XS.length * SAMPLE_YS.length
  SAMPLE_YS.forEach((y) => {
    SAMPLE_XS.forEach((x) => {
      const el = document.elementFromPoint(w * x, h * y)
      if (!isWrapper(el)) return
      empty += 1
      if (el) {
        const id = el.id ? `#${el.id}` : ''
        wrappers.add(`${el.tagName.toLowerCase()}${id}`)
      }
    })
  })
  return { empty, total, wrappers: Array.from(wrappers) }
}

/**
 * 安排一次检测。新调用会取消未触发的旧定时器；延迟被钳在剩余 MAX_WAIT_MS 内。
 * @param {number} delay 期望延迟（毫秒）
 */
function scheduleCheck(delay: number): void {
  if (typeof window === 'undefined') return
  if (timer) window.clearTimeout(timer)
  const wait = Math.max(0, Math.min(delay, MAX_WAIT_MS - elapsedMs()))
  timer = window.setTimeout(() => {
    void runCheck()
  }, wait)
}

/**
 * 实际判定：页可见、本 pathname 未报过、空白 ≥ 88%、有 lastFatal、
 * 且已加载完或已满 25s。全部满足才上报 blank-screen。
 */
function runCheck(): void {
  if (!reporter) return
  if (document.visibilityState === 'hidden') return
  if (reportedPath === location.pathname) return

  const sample = sampleViewport()
  if (!sample.total) {
    retryLater()
    return
  }

  const emptyRatio = sample.empty / sample.total
  if (emptyRatio < EMPTY_RATIO) return

  // 没有页面级错误时不报：弱网慢加载、骨架屏都不算报错白屏
  if (!lastFatal) return

  const overMaxWait = elapsedMs() >= MAX_WAIT_MS
  if (!overMaxWait && stillLoading()) {
    retryLater()
    return
  }

  reportedPath = location.pathname
  const conn = getConnection()
  const source = lastFatal
  reporter({
    reportsType: MechanismType.BS,
    errorType: 'BlankScreen',
    errorUid: getErrorUid(`${MechanismType.BS}-${location.pathname}-${source.errorUid}`),
    value: `页面白屏: ${source.errorType || source.reportsType} ${source.value || ''} | empty=${sample.empty}/${sample.total} net=${conn.effectiveType || 'unknown'} fcp=${hasFcp() ? 1 : 0} wait=${elapsedMs()}`.trim(),
    meta: {
      file: location.href,
      url: location.href,
      /** 空白点数 */
      status: sample.empty,
      /** 采样总点数 */
      row: sample.total,
      /** 空白占比百分数 */
      col: Math.round(emptyRatio * 100),
      /** 网络类型 */
      statusText: conn.effectiveType || 'unknown',
    },
  })
}

/**
 * 采样无效或仍在加载时，按网络延迟再试，最多 MAX_RETRY 次。
 */
function retryLater(): void {
  if (retryCount >= MAX_RETRY) return
  retryCount += 1
  scheduleCheck(getWaitMs())
}
