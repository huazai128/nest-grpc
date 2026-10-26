import { IMetrics } from './interfaces/util.interface'
import LogStore from './logStore'
import fastJson from 'fast-json-stringify'
import { compactLogBatch } from './compactLog'

/** 批量上报 JSON schema：siteId / traceId 放外层，logs 为压缩后的单条列表 */
const schema = {
  type: 'object' as const,
  properties: {
    // 整批日志共享的会话级公共字段，提到外层只上报一次，避免每条日志重复携带
    siteId: { type: 'string' as const },
    traceId: { type: 'string' as const },
    logs: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        additionalProperties: true,
      },
    },
  },
}

const stringify = fastJson(schema)

/** Chrome sendBeacon 常见上限约 64KB，预留余量后超限改走 XHR / keepalive */
const BEACON_MAX_BYTES = 60 * 1024
/** 常规 XHR 上报超时，超时视为失败并保留队列 */
const XHR_TIMEOUT = 10000

/** 批量请求体：会话字段在外层，单条日志不再重复携带 */
type MultiLogPayload = {
  siteId?: string
  traceId: string
  logs: IMetrics[]
}

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  /** 定时续发句柄 */
  private timer?: number
  /** 常规上报间隔（毫秒） */
  private time: number = 1500
  /** 是否正在发送，避免并发出队 */
  private sending = false
  /** 生命周期监听是否已绑定，防止重复注册 */
  private unloadBound = false
  /** 上次隐藏刷新时间，短间隔内去重 */
  private lastFlushAt = 0

  constructor() {
    super()
    this.bindLifecycle()
  }

  /**
   * 离线恢复后续发；隐藏/卸载时尽力把队列送出。
   * @private
   * @memberof SendLog
   */
  private bindLifecycle() {
    if (this.unloadBound || typeof window === 'undefined') return
    this.unloadBound = true
    window.addEventListener('online', () => {
      this.handlerCommon()
    })
    const flush = () => this.flushOnHide()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  /**
   * 处理每次添加并且触发发送
   * @memberof SendLog
   */
  handlerCommon() {
    if (this.isOver) {
      this.isOver = false
      setTimeout(() => {
        void this.handleRoutineReport()
      }, this.time)
    }
  }

  /**
   * 处理发送
   * @private
   * @memberof SendLog
   */
  handleRoutineReport = async () => {
    this.timer && clearTimeout(this.timer)
    if (this.sending) {
      this.timer = setTimeout(() => {
        void this.handleRoutineReport()
      }, this.time)
      return
    }
    const list = this.peekLog()
    if (!!list.length) {
      this.sending = true
      try {
        const ok = await this.sendMultiLog(list)
        if (ok) {
          this.ackLog(list.length)
        }
      } finally {
        this.sending = false
      }
      this.timer = setTimeout(() => {
        void this.handleRoutineReport()
      }, this.time)
    } else {
      this.isOver = true
      this.timer && clearTimeout(this.timer)
    }
  }

  /**
   * 组装批量请求体：外层带 siteId / traceId，单条日志做传输压缩。
   * @private
   * @param {IMetrics[]} list
   * @return {MultiLogPayload}
   * @memberof SendLog
   */
  private buildParams(list: IMetrics[]): MultiLogPayload {
    return {
      siteId: this.config?.appKey,
      traceId: this.traceId,
      logs: compactLogBatch(list, this.traceId),
    }
  }

  /**
   * 批量发送。成功（HTTP 2xx）才返回 true，调用方才能 ack 出队。
   * @param {IMetrics[]} list
   * @memberof SendLog
   */
  sendMultiLog = (list: IMetrics[]): Promise<boolean> => {
    if (!this.url) return Promise.resolve(false)
    return this.xmlTransport(stringify(this.buildParams(list)))
  }

  /**
   * 页面隐藏时尽力上报：小包 Beacon，超限用 keepalive fetch。
   * Beacon 入队成功则 ack，避免刷新后重复；失败保留队列等下次会话补报。
   * @private
   * @memberof SendLog
   */
  private flushOnHide = () => {
    if (!this.url || !this.logList.length) return
    const now = Date.now()
    if (now - this.lastFlushAt < 500) return
    this.lastFlushAt = now
    const pending = [...this.logList]
    let acked = 0
    for (let i = 0; i < pending.length; i += this.len) {
      const list = pending.slice(i, i + this.len)
      const payload = stringify(this.buildParams(list))
      let queued = false
      if (payload.length <= BEACON_MAX_BYTES && typeof navigator.sendBeacon === 'function') {
        try {
          queued = !!window.navigator.sendBeacon(this.url, payload)
        } catch {
          queued = false
        }
      }
      if (!queued) {
        this.keepaliveSend(payload)
        break
      }
      acked += list.length
    }
    if (acked > 0) this.ackLog(acked)
  }

  /**
   * 页面卸载阶段用 fetch keepalive 补发，无法确认成功故不 ack。
   * @private
   * @param {string} payload
   * @memberof SendLog
   */
  private keepaliveSend(payload: string) {
    const nativeFetch = ((window as any).oFetch || window.fetch) as typeof fetch | undefined
    if (typeof nativeFetch !== 'function') return
    try {
      void nativeFetch.call(window, this.url, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        keepalive: true,
      })
    } catch {
      // 卸载阶段无法再重试
    }
  }

  /**
   * 原生 XHR 上报，确认 2xx。Content-Type 与 sendBeacon / PlainBody 对齐为 text/plain。
   * @memberof SendLog
   */
  xmlTransport = (payload: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const XHR = ((window as any).oXMLHttpRequest || window.XMLHttpRequest) as typeof XMLHttpRequest
        const xhr = new XHR()
        xhr.open('POST', this.url, true)
        xhr.timeout = XHR_TIMEOUT
        xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
        xhr.onload = () => {
          resolve(xhr.status >= 200 && xhr.status < 300)
        }
        xhr.onerror = () => resolve(false)
        xhr.ontimeout = () => resolve(false)
        xhr.send(payload)
      } catch {
        resolve(false)
      }
    })
  }
}

/** 全局单例，各采集模块共用同一队列 */
export default new SendLog()
