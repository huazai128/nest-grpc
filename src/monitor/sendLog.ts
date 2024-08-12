import Config from './config'
import { ConfigProps } from './interfaces/config.interface'
import { MetricsName } from './interfaces/util.interface'
import LogStore from './logStore'

/**
 * 发送日志
 * @export
 * @class SendLog
 * @extends {LogStore}
 */
export class SendLog extends LogStore {
  public readonly config!: ConfigProps
  constructor() {
    super()
    this.config = Config.getConfig()
  }

  handlerCommon(key: MetricsName | string): void {
    console.log('=====')
  }
}
