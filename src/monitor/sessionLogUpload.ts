import sendLog from './sendLog'
import { SessionLogReason, SessionLogSnapshot, snapshotSessionLog } from './sessionLog'

/** 上传会话 .log 超时。超时后改把正文挂到上报，由服务端再转 OSS。 */
const UPLOAD_TIMEOUT_MS = 8000

/** 白屏 / 反馈上报时附带的会话日志字段：优先只有链接 */
export type SessionLogAttach = {
  logName: string
  logUrl?: string
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
  const logUrl = await uploadSessionFile(snap, reason)
  if (logUrl) {
    return { logName: snap.logName, logUrl }
  }
  return { logName: snap.logName, events: snap.events }
}

/**
 * 把 .log 正文 POST 到上报服务，解析拦截器包装后的 logUrl。
 * @param {SessionLogSnapshot} snap
 * @param {SessionLogReason} reason
 * @return {Promise<(string | undefined)>}
 */
function uploadSessionFile(snap: SessionLogSnapshot, reason: SessionLogReason): Promise<string | undefined> {
  const base = sendLog.config?.url
  if (!base || typeof XMLHttpRequest === 'undefined') return Promise.resolve(undefined)

  return new Promise((resolve) => {
    let settled = false
    const done = (url?: string) => {
      if (settled) return
      settled = true
      resolve(url)
    }
    const timer = window.setTimeout(() => done(undefined), UPLOAD_TIMEOUT_MS)
    try {
      const XHR = ((window as any).oXMLHttpRequest || window.XMLHttpRequest) as typeof XMLHttpRequest
      const xhr = new XHR()
      xhr.open('POST', `${base}/api/log/session-file`, true)
      xhr.timeout = UPLOAD_TIMEOUT_MS
      xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8')
      xhr.setRequestHeader('X-Session-Log-Name', snap.logName)
      xhr.setRequestHeader('X-Session-Log-Reason', reason)
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
        done(parseLogUrl(xhr.responseText))
      }
      xhr.onerror = () => {
        window.clearTimeout(timer)
        done(undefined)
      }
      xhr.ontimeout = () => {
        window.clearTimeout(timer)
        done(undefined)
      }
      xhr.send(snap.events)
    } catch {
      window.clearTimeout(timer)
      done(undefined)
    }
  })
}

/**
 * 从 /session-file 响应里抽出 OSS 链接。兼容拦截器 { result: { logUrl } }。
 * @param {string} raw
 * @return {(string | undefined)}
 */
function parseLogUrl(raw: string): string | undefined {
  if (!raw) return undefined
  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    const result = (json.result && typeof json.result === 'object' ? json.result : json) as Record<string, unknown>
    const url = result.logUrl
    return typeof url === 'string' && url ? url : undefined
  } catch {
    return undefined
  }
}
