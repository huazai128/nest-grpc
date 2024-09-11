import { ConfigProps } from './interfaces/config.interface'
import { MetricsName } from './interfaces/util.interface'
import LogStore from './logStore'
import { wrHistory } from './utils'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  private url!: string
  public config!: ConfigProps
  constructor() {
    super()
    wrHistory()
  }

  /**
   * 配置设置
   * @param {ConfigProps} config
   * @memberof SendLog
   */
  setConfig(config: ConfigProps) {
    this.config = config
    this.url = this.config.url + '/api/log/multi'
  }

  /**
   * 处理每次添加并且触发发送
   * @param {(MetricsName | string)} key
   * @memberof SendLog
   */
  handlerCommon(key: MetricsName | string) {
    if (!this.keys.includes(key)) {
      this.keys.push(key)
    }
    if (!this.isOver) {
      this.isOver = true
      this.handleRoutineReport()
    }
  }

  /**
   * 处理发送
   * @private
   * @memberof SendLog
   */
  private handleRoutineReport() {}
}

export default new SendLog()
