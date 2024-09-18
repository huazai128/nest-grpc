interface APIRule {
  apiUrlPattern: string
  key: string
  enums?: any[]
  allowEmpty?: boolean // true 空值不上报 false 空值上报
}

export interface Site {
  _id: string
  id: number
  create_at: string
  isApi: ReportStatus
  name: string
  state: PublishState
  update_at: string
  reportUrl: string
  apiRules: APIRule[]
  recordWhiteList: number[]
}

export interface SiteDTO {
  name: string
  isApi: PublishState
  reportUrl: string
}

export enum PublishState {
  Draft = 0, // 草稿
  Published = 1, // 已发布
  Recycle = -1, // 回收站
}

export enum ReportStatus {
  NotReport = 0, // API 不上报告警
  Report = 1, //  API 接口异常上报告警
}
