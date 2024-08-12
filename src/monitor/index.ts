import { ConfigProps } from './interfaces/config.interface'
import { UserVitals } from './userVitals'
import { WebVitals } from './webVitals'

export class Monitor {
  constructor(data: ConfigProps) {
    const { url, appKey } = data
    if (!url) {
      throw '上报url为空'
    }
    if (!appKey) {
      throw '上报map 存储位置为空'
    }
    const userVitals = new UserVitals()
    const webVitals = new WebVitals()
  }
}
