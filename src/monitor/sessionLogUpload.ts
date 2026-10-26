import sendLog from './sendLog'
import { SessionLogReason, snapshotSessionLog } from './sessionLog'

/** 上传会话 .log 超时。超时后改把正文挂到上报，由服务端再转 OSS。 */
const SESSION_UPLOAD_TIMEOUT_MS = 8000
/** rrweb 单片段约 2MB，给更长超时。 */
const RECORD_UPLOAD_TIMEOUT_MS = 15000

/** 白屏 / 反馈上报时附带的会话日志字段：优先只有链接 */
export type SessionLogAttach = {
  logName: string
  logUrl?: string
  events?: string
}

/** 录屏上报字段：优先只有 OSS 链接 */
export type RecordEventsAttach = {
  eventsUrl?: string
  events?: string
}

/**
 * 取出本地 .log，先 POST 到 /api/log/session-file 换 OSS 链接。
 * 成功只返回 logName + logUrl；失败才带 events 正文，避免 Kafka/Mongo 吃 1.5MB。
 * @param {SessionLogReason} reason
 * @param {string} [traceId]
 * @return {Promise<SessionLogAttach>}
 */
export async function attachSessionLog(
  reason: SessionLogReason,
  traceId?: string,
): Promise<SessionLogAttach> {
  const snap = snapshotSessionLog(reason, traceId)
  const logUrl = await uploadOssFile({
    path: '/api/log/session-file',
    body: snap.events,
    contentType: 'text/plain;charset=UTF-8',
    timeout: SESSION_UPLOAD_TIMEOUT_MS,
    headers: {
      'X-Session-Log-Name': snap.logName,
      'X-Session-Log-Reason': reason,
    },
    urlKeys: ['logUrl', 'url'],
  })
  if (logUrl) {
    return { logName: snap.logName, logUrl }
  }
  return { logName: snap.logName, events: snap.events }
}

/**
 * 把 rrweb JSON 先 POST 到 /api/log/record-file 换 OSS 链接。
 * 成功只返回 eventsUrl；失败才带 events 正文。
 * @param {string} monitorId
 * @param {string} eventsJson
 * @return {Promise<RecordEventsAttach>}
 */
export async function attachRecordEvents(monitorId: string, eventsJson: string): Promise<RecordEventsAttach> {
  const eventsUrl = await uploadOssFile({
    path: '/api/log/record-file',
    body: eventsJson,
    contentType: 'application/json',
    timeout: RECORD_UPLOAD_TIMEOUT_MS,
    headers: {
      'X-Record-Id': monitorId,
    },
    urlKeys: ['eventsUrl', 'url'],
  })
  if (eventsUrl) {
    return { eventsUrl }
  }
  return { events: eventsJson }
}

type OssUploadOptions = {
  path: string
  body: string
  contentType: string
  timeout: number
  headers: Record<string, string>
  urlKeys: string[]
}

/**
 * 把正文 POST 到上报服务换 OSS 链接。兼容拦截器 { result: { logUrl|eventsUrl } }。
 * @param {OssUploadOptions} options
 * @return {Promise<(string | undefined)>}
 */
function uploadOssFile(options: OssUploadOptions): Promise<string | undefined> {
  const base = sendLog.config?.url
  if (!base || typeof XMLHttpRequest === 'undefined') return Promise.resolve(undefined)

  return new Promise((resolve) => {
    let settled = false
    const done = (url?: string) => {
      if (settled) return
      settled = true
      resolve(url)
    }
    const timer = window.setTimeout(() => done(undefined), options.timeout)
    try {
      const XHR = ((window as any).oXMLHttpRequest || window.XMLHttpRequest) as typeof XMLHttpRequest
      const xhr = new XHR()
      xhr.open('POST', `${base}${options.path}`, true)
      xhr.timeout = options.timeout
      xhr.setRequestHeader('Content-Type', options.contentType)
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value) xhr.setRequestHeader(key, value)
      })
      if (sendLog.config?.appKey) {
        xhr.setRequestHeader('X-Site-Id', sendLog.config.appKey)
      }
      if (sendLog.traceId) {
        xhr.setRequestHeader('X-Trace-Id', sendLog.traceId)
      }
      xhr.onload = () => {
        window.clearTimeout(timer)
        if (xhr.status < 200 || xhr.status >= 300) {
          done(undefined)
          return
        }
        done(parseOssUrl(xhr.responseText, options.urlKeys))
      }
      xhr.onerror = () => {
        window.clearTimeout(timer)
        done(undefined)
      }
      xhr.ontimeout = () => {
        window.clearTimeout(timer)
        done(undefined)
      }
      xhr.send(options.body)
    } catch {
      window.clearTimeout(timer)
      done(undefined)
    }
  })
}

/**
 * 从 OSS 上传响应里抽出链接。
 * @param {string} raw
 * @param {string[]} urlKeys
 * @return {(string | undefined)}
 */
function parseOssUrl(raw: string, urlKeys: string[]): string | undefined {
  if (!raw) return undefined
  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    const result = (json.result && typeof json.result === 'object' ? json.result : json) as Record<string, unknown>
    for (const key of urlKeys) {
      const url = result[key]
      if (typeof url === 'string' && url) return url
    }
    return undefined
  } catch {
    return undefined
  }
}
