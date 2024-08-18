import { Injectable } from '@tanbo/di'
import { MetricsName } from './interfaces/util.interface'
import { SendLog } from './sendLog'
import 'reflect-metadata'

/**
 * 监听用户行为
 * @export
 * @class UserVitals
 */
@Injectable()
export class UserVitals {
  constructor(public sendLog: SendLog) {
    this.sendLog.add(MetricsName.CBR, { name: '1' })
  }
}
