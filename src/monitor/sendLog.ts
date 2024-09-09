import { MetricsName } from './interfaces/util.interface'
import LogStore from './logStore'
import 'reflect-metadata'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  private isOnce: boolean = false
  handlerCommon(key: MetricsName | string) {
    if (!this.keys.includes(key)) {
      this.keys.push(key)
    }
    if (!this.isOver) {
      this.isOver = true
      this.handleRoutineReport()
    }
  }
  private handleRoutineReport() {}
}

export default new SendLog()
