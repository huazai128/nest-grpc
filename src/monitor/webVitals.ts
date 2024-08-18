import { Injectable } from '@tanbo/di'
import { MetricsName } from './interfaces/util.interface'
import { SendLog } from './sendLog'
import 'reflect-metadata'

/**
 * 监听 web 性能
 * @export
 * @class webVitals
 */
@Injectable()
export class WebVitals {
  constructor(public sendLog: SendLog) {
    this.sendLog.add(MetricsName.CBR, { name: '2' })
  }
}
