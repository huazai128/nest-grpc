export interface ConfigProps {
  url: string // 上报Url
  isExposure?: boolean // 是否支持曝光埋点
  appKey: string //上报map 存储位置
  mode: string // 环境
  maxBehaviorRecords?: number // 最大行为跟踪数
  isOnRecord?: boolean // 是否支持录屏
}
