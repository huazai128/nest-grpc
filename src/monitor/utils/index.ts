/* eslint-disable @typescript-eslint/no-empty-function */
import {
  FN1,
  IMetrics,
  MechanismType,
  MPerformanceNavigationTiming,
  PerformanceEntryHandler,
  ResourceFlowTiming,
} from '../interfaces/util.interface'

window.performance = window.performance || window.msPerformance || window.webkitPerformance

export const supported = {
  performance: !!window.performance,
  getEntriesByType: !!(window.performance && window.performance.getEntriesByType),
  PerformanceObserver: 'PerformanceObserver' in window,
  MutationObserver: 'MutationObserver' in window,
  PerformanceNavigationTiming: 'PerformanceNavigationTiming' in window,
}

export interface MutationObserverHandler {
  (mutation: MutationRecord): void
}

export const mOberver = (callback: MutationObserverHandler): MutationObserver => {
  const mOb = new MutationObserver(function (mutationsList: MutationRecord[]) {
    mutationsList?.forEach(callback)
  })
  mOb.observe(document.body, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true,
  })
  return mOb
}

/**
 * 获取资源
 * @param {string} type
 * @param {PerformanceEntryHandler} callback
 * @return {*}  {(PerformanceObserver | undefined)}
 */
export const observe = (
  options: PerformanceObserverInit,
  callback: PerformanceEntryHandler,
): PerformanceObserver | undefined => {
  try {
    const ob: PerformanceObserver = new PerformanceObserver((l) => l.getEntries().map(callback))
    ob.observe(options)
    return ob
  } catch (error) {}
  return undefined
}

/**
 * 监听页面加载完成
 * @param {*} callback
 */
export const afterLoad = (callback: any) => {
  if (document.readyState === 'complete') {
    setTimeout(callback)
  } else {
    window.addEventListener('pageshow', callback, { once: true, capture: true })
  }
}

/**
 * FP
 * @return {*}
 */
export const getFP = async () => {
  return new Promise<IMetrics | undefined>((resolve, reject) => {
    if (supported.PerformanceObserver) {
      try {
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntriesByName('first-paint')) {
            resolve(entry)
          }
        }).observe({ type: 'paint', buffered: true })
        return false
      } catch (error) {
        // 在safari下获取为空数组
        const entryList = performance.getEntriesByName('first-paint')
        resolve(entryList[0])
      }
    } else {
      const entryList = performance.getEntriesByName('first-paint')
      resolve(entryList[0])
    }
  })
}

/**
 * 获取NT
 * @return {*}  {(MPerformanceNavigationTiming | undefined)}
 */
export const getNavigationTiming = (): MPerformanceNavigationTiming | undefined => {
  const resolveNavigationTiming = (entry: PerformanceNavigationTiming): MPerformanceNavigationTiming => {
    const {
      domainLookupStart,
      domainLookupEnd,
      connectStart,
      connectEnd,
      secureConnectionStart,
      requestStart,
      responseStart,
      responseEnd,
      domInteractive,
      domContentLoadedEventEnd,
      loadEventStart,
      fetchStart,
    } = entry

    return {
      fp: responseEnd - fetchStart, // 白屏时间
      tti: domInteractive - fetchStart, // 首次可交互时间
      domReady: domContentLoadedEventEnd - fetchStart, // HTML加载完成时间也就是 DOM Ready 时间。
      load: loadEventStart - fetchStart, // 页面完全加载时间
      firseByte: responseStart - domainLookupStart, // 首包时间
      dns: domainLookupEnd - domainLookupStart, // DNS查询耗时
      tcp: connectEnd - connectStart, // TCP连接耗时
      ssl: secureConnectionStart ? connectEnd - secureConnectionStart : 0, // SSL安全连接耗时
      ttfb: responseStart - requestStart, // 请求响应耗时
      trans: responseEnd - responseStart, // 内容传输耗时
      domParse: domInteractive - responseEnd, // DOM解析耗时
      res: loadEventStart - domContentLoadedEventEnd, // 资源加载耗时
    }
  }

  const navigation =
    // W3C Level2  PerformanceNavigationTiming
    // 使用了High-Resolution Time，时间精度可以达毫秒的小数点好几位。
    performance.getEntriesByType('navigation').length > 0
      ? performance.getEntriesByType('navigation')[0]
      : performance.timing // W3C Level1  (目前兼容性高，仍然可使用，未来可能被废弃)。
  return resolveNavigationTiming(navigation as PerformanceNavigationTiming)
}

/**
 * 获取资源resource加载性能
 * @param {Array<ResourceFlowTiming>} resourceFlow
 * @return {*}  {(PerformanceObserver | undefined)}
 */
export const getResourceFlow = (resourceFlow: Array<ResourceFlowTiming>): PerformanceObserver | undefined => {
  const entryHandler = (entry: PerformanceResourceTiming) => {
    const {
      name,
      transferSize,
      initiatorType,
      startTime,
      responseEnd,
      domainLookupEnd,
      domainLookupStart,
      connectStart,
      connectEnd,
      secureConnectionStart,
      responseStart,
      requestStart,
      duration,
    } = entry
    const isCache = duration == 0 && transferSize !== 0
    resourceFlow.push(
      // name 资源地址
      // startTime 开始时间
      // responseEnd 结束时间
      // time 消耗时间
      // initiatorType 资源类型
      // transferSize 传输大小
      // 请求响应耗时 ttfb = item.responseStart - item.startTime
      // 内容下载耗时 tran = item.responseEnd - item.responseStart
      // 但是受到跨域资源影响。除非资源设置允许获取timing
      {
        // name 资源地址
        name,
        // transferSize 传输大小
        transferSize,
        // initiatorType 资源类型
        initiatorType,
        // startTime 开始时间
        startTime,
        // responseEnd 结束时间
        responseEnd,
        //消耗时间
        time: duration,
        dnsLookup: domainLookupEnd - domainLookupStart,
        initialConnect: connectEnd - connectStart,
        ssl: connectEnd - secureConnectionStart,
        request: responseStart - requestStart,
        ttfb: responseStart - requestStart,
        contentDownload: responseStart - requestStart,
        // 是否命中缓存
        isCache: isCache,
      },
    )
  }

  return observe({ type: 'resource' }, entryHandler) // 没有监听到全部资源加载
}

/**
 * 重现监听pushState replaceState 事件
 * @param {keyof History} type
 * @return {*}
 */
const wr = (type: keyof History) => {
  const orig = history[type]
  return function (this: unknown) {
    // eslint-disable-next-line prefer-rest-params
    const rv = orig.apply(this, arguments)
    const e = new Event(type)
    window.dispatchEvent(e)
    return rv
  }
}

/**
 * 添加 pushState replaceState 事件
 */
export const wrHistory = (): void => {
  history.pushState = wr('pushState')
  history.replaceState = wr('replaceState')
}

/**
 * 为 pushState 以及 replaceState 方法添加 Event 事件
 * @param {FN1} handler
 */
export const proxyHistory = (handler: FN1): void => {
  // 添加对 replaceState 的监听
  window.addEventListener('replaceState', (e) => handler(e), true)
  // 添加对 pushState 的监听
  window.addEventListener('pushState', (e) => handler(e), true)
}

/**
 * 添加对 hashchange 的监听
 * @param {FN1} handler
 */
export const proxyHash = (handler: FN1): void => {
  // hash 变化除了触发 hashchange ,也会触发 popstate 事件,而且会先触发 popstate 事件，我们可以统一监听 popstate
  // 这里可以考虑是否需要监听 hashchange
  window.addEventListener('hashchange', (e) => handler(e), true)
  // 添加对 popstate 的监听
  // 浏览器回退、前进行为触发的 可以自己判断是否要添加监听
  window.addEventListener('popstate', (e) => handler(e), true)
}

/**
 * 判断是js异常、静态资源异常还是跨域异常
 * @param {(ErrorEvent | Event)} event
 * @return {*}
 */
export const getErrorKey = (event: ErrorEvent | Event) => {
  const isJsError = event instanceof ErrorEvent
  if (!isJsError) return MechanismType.RS
  return event.message === 'Script error.' ? MechanismType.CS : MechanismType.JS
}

// 正则表达式，用以解析堆栈split后得到的字符串
const FULL_MATCH =
  /^\s*at (?:(.*?) ?\()?((?:file|https?|blob|chrome-extension|address|native|eval|webpack|<anonymous>|[-a-z]+:|.*bundle|\/).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i

// 限制只追溯10个
const STACKTRACE_LIMIT = 10

// 解析每一行
export function parseStackLine(line: string) {
  const lineMatch = line.match(FULL_MATCH)
  if (!lineMatch) return {}
  const filename = lineMatch[2]
  const functionName = lineMatch[1] || ''
  const lineno = parseInt(lineMatch[3], 10) || undefined
  const colno = parseInt(lineMatch[4], 10) || undefined
  return {
    filename,
    functionName,
    lineno,
    colno,
  }
}

/**
 * 解析错误堆栈
 * @export
 * @param {Error} error
 * @return {*}
 */
export function parseStackFrames(error: Error) {
  const { stack } = error || {}
  // 无 stack 时直接返回
  if (!stack) return []
  const frames = []
  for (const line of stack.split('\n').slice(1)) {
    const frame = parseStackLine(line)
    if (frame) {
      frames.push(frame)
    }
  }
  return frames.slice(0, STACKTRACE_LIMIT)
}

// 对每一个错误详情，生成一串编码, btoa不能处理中文,会报错
export const getErrorUid = (input: string) => {
  return window.btoa(unescape(encodeURIComponent(input)))
}

/**
 * 处理数字类型
 * @export
 * @param {object} e
 * @return {*}
 */
export function normalizePerformanceRecord(e: object) {
  try {
    const obj = JSON.parse(JSON.stringify(e))
    Object.keys(obj).forEach((p) => {
      const v = obj[p]
      if (typeof v === 'number') obj[p] = v === 0 ? 0 : parseFloat(v.toFixed(2))
    })
    return obj
  } catch (error) {
    console.error(error, 'normalizePerformanceRecord')
  }
}

/**
 * 获取cookie
 * @param {string} c_name
 * @return {*}
 */
export const getCookie = (c_name: string) => {
  if (document.cookie.length > 0) {
    let c_start = document.cookie.indexOf(c_name + '=')
    if (c_start != -1) {
      c_start = c_start + c_name.length + 1
      let c_end = document.cookie.indexOf(';', c_start)
      if (c_end == -1) {
        c_end = document.cookie.length
      }
      return decodeURIComponent(document.cookie.substring(c_start, c_end))
    }
  }
  return ''
}

/**
 *
 * 获取FCP
 * @return {*}  {Promise<PerformanceEntry>}
 */
export const getFCP = (): Promise<PerformanceEntry> => {
  return new Promise<PerformanceEntry>((resolve) => {
    if (supported.PerformanceObserver) {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntriesByName('first-contentful-paint')) {
          resolve(entry)
        }
      }).observe({ type: 'paint', buffered: true })
    } else {
      setTimeout(() => {
        if (supported.performance) {
          const [entry] = performance.getEntriesByName('first-contentful-paint')
          resolve(entry)
        }
      }, 50)
    }
  })
}

/**
 * 处理参数
 * @param {string} url
 * @param {object} params
 */
export const handleUrlParmas = (url: string, params: object): string => {
  for (const [k, v] of Object.entries(params)) {
    if (typeof v !== 'object' && !!v) {
      url += `&${k}=${encodeURIComponent(v as any)}`
    } else if (typeof v == 'object' && v) {
      if (!(Array.isArray(v) && !v.length)) {
        url += `&${k}=${encodeURIComponent(JSON.stringify(v as any))}`
      }
    }
  }
  return url
}

/**
 * 获取资源resource加载性能
 * new PerformanceObserver获取资源有部分获取不了
 * @return {*}  {Array<ResourceFlowTiming>}
 */
export const getPerformanceResourceFlow = (): Array<ResourceFlowTiming> => {
  if (supported.performance) {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const list = entries.filter((entry) => {
      return ['fetch', 'xmlhttprequest', 'beacon'].indexOf(entry.initiatorType) === -1
    })
    const metrics = list.map((entry) => {
      const {
        name,
        transferSize,
        initiatorType,
        startTime,
        responseEnd,
        domainLookupEnd,
        domainLookupStart,
        connectStart,
        connectEnd,
        secureConnectionStart,
        responseStart,
        requestStart,
        duration,
      } = entry
      const dnsLookup = domainLookupEnd - domainLookupStart
      const initialConnect = connectEnd - connectStart
      const isCache = (duration == 0 && transferSize !== 0) || (!dnsLookup && !initialConnect)
      return {
        // name 资源地址
        name,
        // transferSize 传输大小
        transferSize,
        // initiatorType 资源类型
        initiatorType,
        // startTime 开始时间
        startTime,
        // responseEnd 结束时间
        responseEnd,
        //消耗时间
        time: duration,
        dnsLookup: dnsLookup,
        initialConnect: initialConnect,
        ssl: connectEnd - secureConnectionStart,
        request: responseStart - requestStart,
        ttfb: responseStart - requestStart,
        contentDownload: responseStart - requestStart,
        // 是否命中缓存
        isCache: !!isCache,
      }
    })
    return metrics
  }
  return []
}

/**
 * 通过请求图片获取网络速度
 * @param {*} { url, size }
 * @return {*}
 */
export function downloadSpeed({ url, size }: { url: string; size: number }): Promise<Record<string, number>> {
  return new Promise<Record<string, number>>((resolve, reject) => {
    const img = new Image()
    img.src = `${url}?_t=${Math.random()}` // 加个时间戳以避免浏览器只发起一次请求
    const startTime = performance.now()

    img.onload = function () {
      const fileSize = size // 单位是 kb
      const endTime = performance.now()
      const costTime = endTime - startTime
      const speed = (fileSize / (endTime - startTime)) * 1000 // 单位是 kb/s
      resolve({ speed, costTime })
    }

    img.onerror = reject
  })
}
