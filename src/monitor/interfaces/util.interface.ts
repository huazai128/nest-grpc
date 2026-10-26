/* eslint-disable @typescript-eslint/ban-types */

/** 单条日志通用结构，采集模块按 category 扩展字段 */
export interface IMetrics {
  [prop: string | number]: any
}

/** PerformanceObserver 条目回调 */
export interface PerformanceEntryHandler {
  (entry: any): void
}

/** 无参回调，如 afterLoad */
export type FN = () => void
/** 单参事件回调，如路由 / 错误监听 */
export type FN1 = (e: any) => void
/** 双参回调 */
export type FN2<T, P> = (e: T, other: P) => void

/**
 * 导航计时（Navigation Timing）各阶段耗时，单位毫秒。
 * firseByte 字段名沿用现有实现。
 */
export interface MPerformanceNavigationTiming {
  /** 白屏时间：responseEnd - fetchStart */
  fp?: number
  /** 首次可交互：domInteractive - fetchStart */
  tti?: number
  /** DOM Ready */
  domReady?: number
  /** 页面完全加载 */
  load?: number
  /** 首包时间 */
  firseByte?: number
  /** DNS 查询耗时 */
  dns?: number
  /** TCP 连接耗时 */
  tcp?: number
  /** SSL 耗时 */
  ssl?: number
  /** Time To First Byte */
  ttfb?: number
  /** 内容传输耗时 */
  trans?: number
  /** DOM 解析耗时 */
  domParse?: number
  /** 资源加载耗时 */
  res?: number
}

/** 错误机制类型，对应错误日志 reportsType */
export enum MechanismType {
  /** 同步 JS 异常（window.onerror） */
  JS = 'js',
  /** 静态资源加载失败 */
  RS = 'resource',
  /** 未捕获 Promise rejection */
  UJ = 'unhandledrejection',
  /** HTTP 4xx/5xx 或业务失败 */
  HP = 'http-record',
  /** 跨域脚本 Script error. */
  CS = 'cors',
  /** React ErrorBoundary / initReactError */
  REACT = 'react',
  /** 页面报错导致的白屏，需结合视口采样与弱网等待判定 */
  BS = 'blank-screen',
}

/**
 * 静态资源加载性能。dnsLookup / initialConnect / ssl 为 0 时不上报。
 * request 与 ttfb 重复，SDK 不传，服务端用 ttfb 回填。
 */
export interface ResourceFlowTiming {
  /** 资源 URL */
  name: string
  /** 传输大小 */
  transferSize: number
  /** 资源类型，如 script / link / img */
  initiatorType: string
  /** 开始时间 */
  startTime: number
  /** 响应结束时间 */
  responseEnd: number
  /** DNS 耗时，为 0 省略 */
  dnsLookup?: number
  /** TCP 连接耗时，为 0 省略 */
  initialConnect?: number
  /** SSL 耗时，无 SSL 或为 0 省略 */
  ssl?: number
  /** 首字节耗时：responseStart - requestStart */
  ttfb: number
  /** 内容下载耗时：responseEnd - responseStart */
  contentDownload: number
  /** 总耗时，来自 duration */
  time: number
  /** 是否命中缓存 */
  isCache: boolean
}

/** 细分上报类型，写入单条日志 reportsType */
export enum MetricsName {
  /** 首次绘制 */
  FP = 'first-paint',
  /** 首次内容绘制 */
  FCP = 'first-contentful-paint',
  /** 首次有意义绘制（最大元素近似） */
  FMP = 'first-meaning-paint',
  /** 导航各阶段耗时 */
  NT = 'navigation-timing',
  /** 静态资源加载瀑布 */
  RF = 'resource-flow',
  /** 路由变化 / PV */
  RCR = 'router-change-record',
  /** 点击行为 */
  CBR = 'click-behavior-record',
  /** 自定义埋点 */
  CDR = 'custom-define-record',
  /** 接口请求 */
  HT = 'http-record',
  /** 元素曝光 */
  CE = 'change-exposure',
  /** 录屏片段 */
  RV = 'record-video',
}

/** 上报大类，写入单条日志 category */
export enum TransportCategory {
  /** 页面访问 */
  PV = 'pv',
  /** 性能指标 */
  PREF = 'perf',
  /** 用户行为（点击 / 曝光等） */
  EVENT = 'event',
  /** 自定义埋点 / 测速 */
  CUSTOM = 'custom',
  /** 接口日志 */
  API = 'api',
  /** 错误（含报错白屏） */
  ERROR = 'error',
  /** 录屏 */
  RV = 'video',
  /** 用户反馈 */
  USER = 'user',
  /** 会话级网页信息，服务端 Redis 缓存 */
  WebInfo = 'webInfo',
  /** 页面级信息，服务端 Redis 缓存 */
  PageInfo = 'pageInfo',
}

/**
 * HTTP 请求采集指标。
 * queryUrl 含 query；url / params 由服务端从 queryUrl 拆出，SDK 不再重复上报。
 */
export interface HttpMetrics {
  /** 请求方法 */
  method: string
  /** 含 query 的完整请求 URL */
  queryUrl: string
  /** 请求体 */
  body: any
  /** 请求发起时间戳 */
  requestTime: number
  /** 响应完成时间戳 */
  responseTime: number
  /** HTTP 状态码；fetch 异常时为 0 */
  status: number
  /** HTTP 状态文本或异常消息 */
  statusText: string
  /** 响应摘要 */
  response: any
  /** fetch 初始化时间戳；XHR 为 0 不上报 */
  zeroTime: number
  /** fetch 开始等待响应时间戳；为 0 不上报 */
  loadingTime: number
  /** fetch 收到响应时间戳；为 0 不上报 */
  loadedTime: number
  /** fetch clone 响应后的时间戳；为 0 不上报 */
  interactionTime: number
  /** fetch 读取响应文本完成时间戳；为 0 不上报 */
  endTime: number
}

/**
 * 自定义埋点，通过 window.sendTracker 上报。
 * @export
 * @interface CustomAnalyticsData
 */
export interface CustomAnalyticsData {
  /** 事件类别 */
  eventCategory: string
  /** 事件动作 */
  eventAction: string
  /** 事件标签 */
  eventLabel: string
  /** 事件值，可选 */
  eventValue?: string
  /** 自定义事件 ID */
  eventId: number
}

/** 错误采集内部结构，经 errorSendHandler 补齐 breadcrumbs / recordKeys 后入队 */
export interface ExceptionMetrics {
  /** 错误机制类型 */
  reportsType: string
  /** 错误消息或错误响应 */
  value?: string
  /** 错误类型名 */
  errorType: string
  /** 解析后的堆栈 */
  stackTrace?: Object
  /** 最近用户行为轨迹 */
  breadcrumbs?: Array<string>
  /** 错误上下文（文件、行列、接口指标等） */
  meta?: any
  /** 错误指纹，用于去重 */
  errorUid: string
  /** React 错误对应组件名 */
  componentName?: string
  /** 上传失败时的会话 .log 正文兜底；成功后不带 */
  events?: string
  /** 会话 .log 文件名 */
  logName?: string
  /** 会话 .log 的阿里云 OSS 链接 */
  logUrl?: string
}

/** React ErrorBoundary 传入的组件栈信息 */
export interface ErrorInfo {
  /** 组件堆栈字符串 */
  componentStack: string
  /** 组件名 */
  componentName: string
}

/** 网页 / 页面基础信息，分别作为 webInfo、pageInfo 上报并在服务端缓存 */
export interface PageInfo {
  /** 浏览器语种，如 zh */
  lang?: string
  /** 屏幕宽高 */
  winScreen?: string
  /** 文档宽高 */
  docScreen?: string
  /** 用户 ID，来自 cookie */
  userId?: string
  /** 文档标题 */
  title?: string
  /** 路由 path */
  path?: string
  /** 当前完整 URL */
  href?: string
  /** document.referrer */
  referrer?: string
  /** 上一页 href */
  prevHref?: string
  /** 触发跳转的事件类型，如 pageshow / pushState */
  jumpType?: string
  /** performance.navigation.type：0 新开、1 刷新、2 前进后退、255 其他 */
  type?: number
  /** 会话追踪 ID */
  traceId?: string
  /** 页面 ID，路由变化时重新生成 */
  pageId?: string
}

/** 行为轨迹项，错误 / 反馈日志用 monitorId 反查完整行为 */
export interface BehaviorItem {
  /** 行为所属 category */
  type: TransportCategory
  /** 对应行为日志 ID */
  monitorId: string
}
