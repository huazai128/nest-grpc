import { UserVitals } from './userVitals'
import { WebVitals } from './webVitals'
import { ConfigProps } from './interfaces/config.interface'
import ErrorVitals from './errorVitals'
import sendLog from './sendLog'

/**
 * 监控类
 * @export
 * @class Monitor
 */
export class Monitor {
  constructor(data: ConfigProps) {
    const { url, appKey } = data
    if (!url) {
      throw '上报url为空'
    }
    if (!appKey) {
      throw '上报map 存储位置为空'
    }
    sendLog.setConfig(data)
    new WebVitals()
    new UserVitals()
    new ErrorVitals()
  }
}
