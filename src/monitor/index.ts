import { UserVitals } from './userVitals'
import { WebVitals } from './webVitals'
import { ConfigProps } from './interfaces/config.interface'
import ErrorVitals from './errorVitals'
import sendLog from './sendLog'
import { rewriteConsole } from './console'

/**
 * 监控 SDK 入口。初始化后自动采集性能、行为、接口、错误和录屏。
 * @export
 * @class Monitor
 */
export class Monitor {
  /**
   * @param {ConfigProps} data 站点配置；url / appKey 必填
   */
  constructor(data: ConfigProps) {
    const { url, appKey } = data
    if (!url) {
      throw '上报url为空'
    }
    if (!appKey) {
      throw '上报map 存储位置为空'
    }
    // prod 静默 console，其它环境保留输出，便于排查采集问题
    rewriteConsole(data.mode)
    sendLog.setConfig(data)
    // 先挂采集再 bootstrap：首屏 pageInfo 才能通知 PV / 曝光 / 白屏
    new WebVitals()
    new UserVitals()
    new ErrorVitals()
    sendLog.bootstrap()
  }
}
