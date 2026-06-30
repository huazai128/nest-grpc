import { IMetrics } from './interfaces/util.interface'
import LogStore from './logStore'
import fastJson from 'fast-json-stringify'

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

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  private timer?: number
  private time: number = 1500
  constructor() {
    super()
  }

  /**
   * 处理每次添加并且触发发送
   * @param {(MetricsName | string)} key
   * @memberof SendLog
   */
  handlerCommon() {
    if (this.isOver) {
      this.isOver = false
      setTimeout(() => {
        this.handleRoutineReport()
      }, this.time)
    }
  }

  /**
   * 处理发送
   * @private
   * @memberof SendLog
   */
  handleRoutineReport = () => {
    this.timer && clearTimeout(this.timer)
    const list = this.getLog()
    if (!!list.length) {
      this.sendMultiLog(list)
      // 控制在每秒上传一次
      this.timer = setTimeout(() => {
        this.handleRoutineReport()
      }, this.time)
    } else {
      this.isOver = true
      this.timer && clearTimeout(this.timer)
    }
  }

  /**
   * 批量发送
   * @param {IMetrics[]} list
   * @memberof SendLog
   */
  sendMultiLog = (list: IMetrics[]) => {
    // siteId/traceId 在一次批量上报内是恒定的，统一放到批量外层，单条日志不再重复携带。
    // 跨会话补报的历史日志会保留各自的 traceId（见 LogStore.initStore），其优先级高于外层默认值。
    const params = {
      siteId: this.config?.appKey,
      traceId: this.traceId,
      logs: list,
    }
    if (typeof navigator.sendBeacon === 'function') {
      try {
        // sendBeacon 上传的长度有限制，而且不同浏览器下长度不一样。建议接口端，尽量是分页逻辑返回。这样可以批量发送
        const isSuccess = window.navigator?.sendBeacon(this.url, stringify(params))
        !isSuccess && this.xmlTransport(params)
      } catch (error) {
        this.xmlTransport(params)
      }
    } else {
      this.xmlTransport(params)
    }
  }

  /**
   * oXMLHttpRequest 上报
   * @memberof SendLog
   */
  xmlTransport = (params: IMetrics) => {
    const xhr = new (window as any).oXMLHttpRequest()
    xhr.open('POST', this.url, true)
    xhr.send(stringify(params))
  }
}

export default new SendLog()
