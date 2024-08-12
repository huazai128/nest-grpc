import Config from './config'
import { ConfigProps } from './interfaces/config.interface'
import { MetricsName } from './interfaces/util.interface'
import LogStore from './logStore'
import 'reflect-metadata'
import { Injectable } from '@tanbo/di'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
@Injectable()
export class SendLog extends LogStore {
  public readonly config!: ConfigProps
  constructor() {
    super()
    this.config = Config.getConfig()
  }

  handlerCommon(key: MetricsName | string): void {
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
