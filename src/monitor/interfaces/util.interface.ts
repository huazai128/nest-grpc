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
}

export interface HttpMetrics {
  method: string
  url: string
  body: Document | XMLHttpRequestBodyInit | null | undefined | ReadableStream
  requestTime: number
  responseTime: number
  status: number
  statusText: string
  response?: any
  params?: any
  queryUrl?: string | URL
  traceId?: string
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
}

export interface ErrorInfo {
  componentStack: string
  componentName: string
}
