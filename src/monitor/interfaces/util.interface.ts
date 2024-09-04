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