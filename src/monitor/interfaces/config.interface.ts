/**
 * SDK 初始化配置，由业务在 `new Monitor(config)` 时传入。
 * @export
 * @interface ConfigProps
 */
export interface ConfigProps {
  /** 上报服务地址，实际请求 `${url}/api/log/multi`；会话 .log 走 `${url}/api/log/session-file` */
  url: string
  /** 是否开启曝光埋点，默认开启；传 false 不监听 `.on-visible` */
  isExposure?: boolean
  /** 站点 ID，上报时作为批次外层 siteId */
  appKey: string
  /** 环境标识，如 test / release / prod；prod 不打印 console，但仍写入本地会话 .log */
  mode: string
  /** 错误关联的行为轨迹最大条数，默认 200 */
  maxBehaviorRecords?: number
  /** 是否开启 rrweb 录屏，默认开启；传 false 不启动 */
  isOnRecord?: boolean
}
