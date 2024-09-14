import { IMetrics } from './interfaces/util.interface'
import LogStore from './logStore'
import CircularJSON from 'circular-json'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  private timer?: number
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
      this.handleRoutineReport()
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
    this.sendMultiLog(list)
    if (!!this.logList.length) {
      // 控制在每秒上次一次
      this.timer = setTimeout(() => {
        this.handleRoutineReport()
      }, 1000)
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
    const params = {
      logs: list,
    }
    if (typeof navigator.sendBeacon === 'function') {
      try {
        // sendBeacon 上传的长度有限制，而且不同浏览器下长度不一样。建议接口端，尽量是分页逻辑返回。这样可以批量发送
        const isSuccess = window.navigator?.sendBeacon(this.url, CircularJSON.stringify(params))
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
    xhr.send(CircularJSON.stringify(params))
  }
}

export default new SendLog()
