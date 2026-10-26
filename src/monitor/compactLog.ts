import { HttpMetrics, IMetrics } from './interfaces/util.interface'

/**
 * 传输压缩：去掉空值/重复字段，超长字符串按服务端入库上限截断。
 * 不删除有业务含义的 0 / false，避免丢失采集结果。
 */

/** 与服务端 LOG_FIELD_LIMITS 对齐：只裁入库本来也会裁掉的字段 */
const LIMITS = {
  indexed: 900, // Mongo 带索引字符串上限（字节）
  value: 8000, // 错误 value 等长文本
  responseResult: 2000, // 响应 result
  nodeDom: 4000, // 节点 HTML 快照
  content: 16000, // 用户反馈内容
  body: 32000, // 请求体
  events: 3 * 1024 * 1024, // 录屏 JSON；会话 .log 走 OSS，失败兜底才走此字段
  logUrl: 2048, // 阿里云 OSS 链接
  ua: 2048, // User-Agent
  logData: 32000, // 通用长文本
}

/** 视为空值并在上报时省略；不含 0 / false */
const EMPTY_OMIT = new Set(['', null, undefined])

/** dataset 展开到根字段时不可覆盖的保留键 */
const RESERVED_ROOT_KEYS = new Set([
  'category',
  'reportsType',
  'monitorId',
  'pageId',
  'timestamp',
  'siteId',
  'traceId',
  'classList',
  'tagName',
  'tagText',
  'nodeId',
  'nodeDom',
  'text',
  'type',
  'events',
  'logName',
  'logUrl',
])

/** 按字段名对齐服务端截断上限；queryUrl / 资源 name / 元素文本不截 */
const STRING_LIMIT_KEYS: Record<string, number> = {
  value: LIMITS.value,
  nodeDom: LIMITS.nodeDom,
  content: LIMITS.content,
  href: LIMITS.indexed,
  path: LIMITS.indexed,
  url: LIMITS.indexed,
  referrer: LIMITS.indexed,
  prevHref: LIMITS.indexed,
  title: LIMITS.indexed,
  userId: LIMITS.indexed,
  method: LIMITS.indexed,
  winScreen: LIMITS.indexed,
  docScreen: LIMITS.indexed,
  monitorId: LIMITS.indexed,
  pageId: LIMITS.indexed,
  errorUid: LIMITS.indexed,
  logName: LIMITS.indexed,
  logUrl: LIMITS.logUrl,
  eventAction: LIMITS.indexed,
  eventCategory: LIMITS.indexed,
  eventValue: LIMITS.logData,
  events: LIMITS.events,
  ua: LIMITS.ua,
  errorDetail: LIMITS.value,
  logData: LIMITS.logData,
  body: LIMITS.body,
}

/**
 * 按 UTF-8 字节截断，超出部分补省略号。
 * @param {string} value
 * @param {number} maxBytes
 * @return {string}
 */
export function truncateByBytes(value: string, maxBytes: number): string {
  const encoded = new TextEncoder().encode(value)
  if (encoded.length <= maxBytes) return value
  const suffix = '…'
  let end = value.length
  while (end > 0 && new TextEncoder().encode(value.slice(0, end) + suffix).length > maxBytes) {
    end -= 1
  }
  return end > 0 ? `${value.slice(0, end)}${suffix}` : suffix
}

/**
 * 递归去掉空字符串 / null / undefined / 空数组 / 空对象。
 * 保留 0、false 等有效采集值。
 * @template T
 * @param {T} input
 * @return {T}
 */
export function omitEmpty<T>(input: T): T {
  if (input === null || input === undefined) return input
  if (typeof input === 'string') return input as T
  if (Array.isArray(input)) {
    const list = input.map((item) => omitEmpty(item)).filter((item) => !EMPTY_OMIT.has(item as never) && !(Array.isArray(item) && item.length === 0))
    return list as T
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      if (EMPTY_OMIT.has(value as never)) return
      if (Array.isArray(value) && value.length === 0) return
      if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return
      const next = omitEmpty(value)
      if (EMPTY_OMIT.has(next as never)) return
      if (Array.isArray(next) && next.length === 0) return
      if (next && typeof next === 'object' && !Array.isArray(next) && Object.keys(next as object).length === 0) return
      out[key] = next
    })
    return out as T
  }
  return input
}

/**
 * 展开元素 dataset，跳过空值和会覆盖日志根字段的保留键。
 * @param {(DOMStringMap | Record<string, string>)} dataset
 * @return {Record<string, string>}
 */
export function pickDataset(dataset: DOMStringMap | Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  Object.entries(dataset || {}).forEach(([key, value]) => {
    if (value == null || value === '') return
    if (RESERVED_ROOT_KEYS.has(key)) return
    out[key] = value
  })
  return out
}

/**
 * 只保留 paint 指标有用字段：entryType / startTime / duration。
 * @param {(Record<string, unknown> | undefined)} entry
 * @return {(Record<string, unknown> | undefined)}
 */
export function compactPaint(entry: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!entry) return undefined
  const paint: Record<string, unknown> = {}
  if (entry.entryType != null) paint.entryType = entry.entryType
  if (entry.startTime != null) paint.startTime = entry.startTime
  if (entry.duration != null) paint.duration = entry.duration
  return Object.keys(paint).length ? paint : undefined
}

/**
 * 压缩 HTTP 采集字段：只上报 queryUrl，为 0 的未采集阶段时间戳省略。
 * @param {HttpMetrics} metrics
 * @param {unknown} [response]
 * @return {Record<string, unknown>}
 */
export function compactHttpMetrics(metrics: HttpMetrics, response?: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {
    method: metrics.method,
    queryUrl: metrics.queryUrl,
    requestTime: metrics.requestTime,
    responseTime: metrics.responseTime,
    status: metrics.status,
  }
  if (metrics.statusText) out.statusText = metrics.statusText
  if (metrics.body != null && metrics.body !== '') {
    out.body = typeof metrics.body === 'string' ? truncateByBytes(metrics.body, LIMITS.body) : metrics.body
  }
  if (response != null && response !== '') out.response = compactResponse(response)
  if (metrics.zeroTime) out.zeroTime = metrics.zeroTime
  if (metrics.loadingTime) out.loadingTime = metrics.loadingTime
  if (metrics.loadedTime) out.loadedTime = metrics.loadedTime
  if (metrics.interactionTime) out.interactionTime = metrics.interactionTime
  if (metrics.endTime) out.endTime = metrics.endTime
  return omitEmpty(out)
}

/**
 * 压缩业务响应摘要，result 按入库上限截断。
 * @param {unknown} response
 * @return {unknown}
 */
function compactResponse(response: unknown): unknown {
  if (!response || typeof response !== 'object') return response
  const rec = response as Record<string, unknown>
  const out: Record<string, unknown> = {}
  if (rec.status != null) out.status = rec.status
  if (rec.message) out.message = rec.message
  if (typeof rec.result === 'string') {
    out.result = truncateByBytes(rec.result, LIMITS.responseResult)
  } else if (rec.result != null) {
    out.result = rec.result
  }
  return omitEmpty(out)
}

/**
 * 发送前压缩单条日志：去掉空值、批次内外重复字段，超长字符串裁到入库上限。
 * 不删除有业务含义的 0 / false。
 * @param {IMetrics} log
 * @param {string} [batchTraceId] 批次外层 traceId，相同时从单条删除
 * @param {string} [prevPageId] 批内上一条 pageId，相同时省略，由服务端回填
 * @return {IMetrics}
 */
export function compactLogForTransport(log: IMetrics, batchTraceId?: string, prevPageId?: string): IMetrics {
  const cloned: IMetrics = omitEmpty({ ...log })
  if (cloned.siteId) delete cloned.siteId
  if (cloned.traceId && cloned.traceId === batchTraceId) delete cloned.traceId
  if (prevPageId && cloned.pageId === prevPageId) delete cloned.pageId

  Object.entries(STRING_LIMIT_KEYS).forEach(([key, max]) => {
    if (typeof cloned[key] === 'string') {
      cloned[key] = truncateByBytes(cloned[key], max)
    }
  })

  if (cloned.response) cloned.response = compactResponse(cloned.response)
  return cloned
}

/**
 * 压缩整批日志，连续相同的 pageId 只保留第一次出现。
 * @param {IMetrics[]} list
 * @param {string} [batchTraceId]
 * @return {IMetrics[]}
 */
export function compactLogBatch(list: IMetrics[], batchTraceId?: string): IMetrics[] {
  let prevPageId: string | undefined
  return list.map((item) => {
    const compact = compactLogForTransport(item, batchTraceId, prevPageId)
    if (typeof item.pageId === 'string' && item.pageId) {
      prevPageId = item.pageId
    }
    return compact
  })
}
