import Config from './config'
import { ConfigProps } from './interfaces/config.interface'
import { MetricsName } from './interfaces/util.interface'
import LogStore from './logStore'
import 'reflect-metadata'
import { Inject, Injectable } from '@tanbo/di'
import { ConfigToken } from '.'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
@Injectable()
export class SendLog extends LogStore {
  constructor(@Inject(ConfigToken) private config: ConfigProps) {
    super()
    console.log(this.config, config, '===dasd')
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
