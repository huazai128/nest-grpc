import { SuspenseProps } from 'react'

export interface SwitchRouterProps {
  onChange?: () => void
}

export interface RouterCompProps extends SwitchRouterProps {
  fallback?: SuspenseProps['fallback']
}

export enum TransportCategory {
  PV = 'pv',
  PREF = 'perf',
  EVENT = 'event',
  CUSTOM = 'custom',
  API = 'api',
  ERROR = 'error',
  RV = 'video',
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
