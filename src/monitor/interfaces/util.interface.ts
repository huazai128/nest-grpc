/* eslint-disable @typescript-eslint/ban-types */
export interface IMetrics {
  [prop: string | number]: any
}

export interface PerformanceEntryHandler {
  (entry: any): void
}

export type FN = () => void
export type FN1 = (e: any) => void
export type FN2<T, P> = (e: T, other: P) => void

export interface MPerformanceNavigationTiming {
  fp?: number
  tti?: number
  domReady?: number
  load?: number
  firseByte?: number
  dns?: number
  tcp?: number
  ssl?: number
  ttfb?: number
  trans?: number
  domParse?: number
  res?: number
}

export enum MechanismType {
  JS = 'js',
  RS = 'resource',
  UJ = 'unhandledrejection',
  HP = 'http-record',
  CS = 'cors',
  REACT = 'react',
}

export interface ResourceFlowTiming {
  name: string
  transferSize: number
  initiatorType: string
  startTime: number
  responseEnd: number
  dnsLookup: number
  initialConnect: number
  ssl: number
  request: number
  ttfb: number
  contentDownload: number
  time: number
  isCache: boolean
}

export enum MetricsName {
  FP = 'first-paint',
  FCP = 'first-contentful-paint',
  FMP = 'first-meaning-paint',
  NT = 'navigation-timing',
  RF = 'resource-flow',
  RCR = 'router-change-record',
  CBR = 'click-behavior-record',
  CDR = 'custom-define-record',
  HT = 'http-record',
  CE = 'change-exposure',
  RV = 'record-video',
}

export enum TransportCategory {
  PV = 'pv',
  PREF = 'perf',
  EVENT = 'event',
  CUSTOM = 'custom',
  API = 'api',
  ERROR = 'error',
  RV = 'video',
  USER = 'user',
  WebInfo = 'webInfo',
  PageInfo = 'pageInfo',
}

export interface HttpMetrics {
  method: string
  url: string
  queryUrl: string
  body: any
  params: Record<string, string>
  requestTime: number
  responseTime: number
  status: number
  statusText: string
  response: any
  zeroTime: number
  loadingTime: number
  loadedTime: number
  interactionTime: number
  endTime: number
}

/**
 * 自定义埋点
 * @export
 * @interface CustomAnalyticsData
 */
export interface CustomAnalyticsData {
  // 事件类别
  eventCategory: string
  // 事件动作
  eventAction: string
  // 事件标签
  eventLabel: string
  // 事件值
  eventValue?: string
  // 自定义事件ID
  eventId: number
}

export interface ExceptionMetrics {
  reportsType: string
  value?: string
  errorType: string
  stackTrace?: Object
  breadcrumbs?: Array<string>
  meta?: any
  errorUid: string
}

export interface ErrorInfo {
  componentStack: string
  componentName: string
}

export interface PageInfo {
  // 浏览器的语种 (eg:zh)
  lang?: string
  // 屏幕宽高
  winScreen?: string
  // 文档宽高
  docScreen?: string
  // 用户ID
  userId?: string
  // 标题
  title?: string
  // 路由
  path?: string
  // href
  href?: string
  // referrer
  referrer?: string
  // prevHref
  prevHref?: string
  // 跳转方式
  jumpType?: string
  // 用户来源方式
  type?: number
  // 页面闭环追踪ID
  traceId?: string
  // 页面切换都会产生UUID
  pageId?: string
}
export interface BehaviorItem {
  type: TransportCategory
  monitorId: string
}
