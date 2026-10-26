/**
 * 会话操作步骤 + console 打印的本地 .log。
 * 日常只在内存里按步骤追加，满 1.5MB 丢掉最旧行；
 * 只有白屏或 window.sendUserLog 反馈时才 snapshot，上传阿里云 OSS 后上报只带链接。
 */

/** 本地 .log 上限（字节），超出丢最旧步骤 */
export const SESSION_LOG_MAX_BYTES = Math.floor(1.5 * 1024 * 1024)

/** 触发上报的原因，写入文件头便于后台区分 */
export type SessionLogReason = 'blank-screen' | 'user-feedback'

/** 单条步骤：格式化后的文本块 + 字节数，便于按上限裁掉最旧行 */
type SessionLogEntry = {
  /** 步骤序号，从 1 递增；裁掉旧行后不重排，方便对照发生顺序 */
  seq: number
  /** 已含换行的完整文本块 */
  text: string
  /** UTF-8 字节数 */
  bytes: number
}

/** snapshot 结果：文件名 + .log 全文 */
export type SessionLogSnapshot = {
  /** 如 session-traceId-blank-screen.log */
  logName: string
  /** .log 全文，含文件头与步骤说明 */
  events: string
  /** 全文 UTF-8 字节数 */
  bytes: number
  /** 当前保留的步骤数 */
  steps: number
}

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : undefined
const entries: SessionLogEntry[] = []
let totalBytes = 0
let seq = 0

/** 单条说明 / 详情行的字符上限，避免一次 console.dir 撑爆文件 */
const LINE_CHARS = 800
/** console 多参数拼接后的总字符上限 */
const CONSOLE_CHARS = 1200

/**
 * UTF-8 字节数。无 TextEncoder 时退回 encodeURIComponent 估算。
 * @param {string} value
 * @return {number}
 */
function utf8Bytes(value: string): number {
  if (encoder) return encoder.encode(value).length
  return unescape(encodeURIComponent(value)).length
}

/**
 * 按字符截断并补省略号。
 * @param {string} value
 * @param {number} max
 * @return {string}
 */
function clip(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(0, max - 1))}…`
}

/**
 * 本地时间 HH:mm:ss.SSS，步骤行用短时间戳节省体积。
 * @param {number} ts
 * @return {string}
 */
function formatClock(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

/**
 * 序列化 console 参数：基本类型直出，Error 取 name/message，对象 JSON 截断。
 * 不调用 console，避免采集自循环。
 * @param {unknown} arg
 * @return {string}
 */
function serializeArg(arg: unknown): string {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  const type = typeof arg
  if (type === 'string') return clip(arg as string, LINE_CHARS)
  if (type === 'number' || type === 'boolean' || type === 'bigint') return String(arg)
  if (type === 'symbol') return (arg as symbol).toString()
  if (type === 'function') return clip(`[Function ${(arg as { name?: string }).name || 'anonymous'}]`, LINE_CHARS)
  if (arg instanceof Error) {
    return clip(`${arg.name}: ${arg.message}`, LINE_CHARS)
  }
  try {
    return clip(JSON.stringify(arg), LINE_CHARS)
  } catch {
    return clip(Object.prototype.toString.call(arg), LINE_CHARS)
  }
}

/**
 * 从完整 URL 抽出 path + search，步骤说明里不写 origin。
 * @param {string} [url]
 * @return {string}
 */
export function shortUrl(url?: string): string {
  const raw = String(url || '')
  if (!raw) return ''
  try {
    const parsed = new URL(raw, typeof location !== 'undefined' ? location.href : 'http://localhost')
    return clip(`${parsed.pathname}${parsed.search}`, LINE_CHARS)
  } catch {
    return clip(raw, LINE_CHARS)
  }
}

/**
 * 丢掉最旧步骤直到总字节落在上限内。
 */
function trimToMax(): void {
  while (entries.length && totalBytes > SESSION_LOG_MAX_BYTES) {
    const oldest = entries.shift()
    if (!oldest) break
    totalBytes -= oldest.bytes
  }
  if (totalBytes < 0) totalBytes = 0
}

/**
 * 写入一条已格式化的步骤。单条超过上限时截断文本，保证至少能留下最新一步。
 * @param {number} nextSeq
 * @param {string} text
 */
function pushEntry(nextSeq: number, text: string): void {
  let block = text.endsWith('\n') ? text : `${text}\n`
  let bytes = utf8Bytes(block)
  if (bytes > SESSION_LOG_MAX_BYTES) {
    const maxChars = Math.max(32, Math.floor(SESSION_LOG_MAX_BYTES / 2))
    block = `${clip(block, maxChars)}\n`
    bytes = utf8Bytes(block)
  }
  entries.push({ seq: nextSeq, text: block, bytes })
  totalBytes += bytes
  trimToMax()
}

/**
 * 追加一条用户操作步骤。details 空行会被丢掉。
 * @param {string} action 如 page / click / http
 * @param {string} title 步骤说明
 * @param {(Array<string | undefined | null> | undefined)} details 附加说明行，已含「键: 值」或纯文本
 */
export function appendSessionStep(
  action: string,
  title: string,
  details?: Array<string | undefined | null>,
): void {
  seq += 1
  const time = Date.now()
  const extra = (details || []).map((line) => String(line || '').trim()).filter(Boolean)
  const lines = [
    `[${seq}] ${formatClock(time)}  STEP  ${action}`,
    `    说明: ${clip(title, LINE_CHARS)}`,
    ...extra.map((line) => `    ${clip(line, LINE_CHARS)}`),
  ]
  pushEntry(seq, `${lines.join('\n')}\n\n`)
}

/**
 * 追加一条 console 打印。prod 静默时仍采集，只是不回写到页面控制台。
 * @param {string} method console 方法名
 * @param {unknown[]} args 原始参数
 */
export function appendSessionConsole(method: string, args: unknown[]): void {
  seq += 1
  const time = Date.now()
  const label = method === 'error' ? '报错' : method === 'warn' ? '警告' : '打印日志'
  const content = clip(args.map(serializeArg).join(' '), CONSOLE_CHARS)
  const lines = [
    `[${seq}] ${formatClock(time)}  CONSOLE  ${method}`,
    `    说明: ${label} console.${method}`,
    content ? `    内容: ${content}` : '    内容: (无参数)',
  ]
  pushEntry(seq, `${lines.join('\n')}\n\n`)
}

/**
 * 当前页 path，步骤里统一带上，方便对照路由。
 * @return {string}
 */
export function currentPagePath(): string {
  if (typeof location === 'undefined') return ''
  return location.pathname || ''
}

/**
 * 当前页短 URL，给 HTTP / 点击步骤当上下文。
 * @return {string}
 */
export function currentPageHref(): string {
  if (typeof location === 'undefined') return ''
  return shortUrl(location.href)
}

/**
 * 取出当前 .log 全文。不会清空本地缓冲，同一会话可多次反馈。
 * 文件头含步骤数、字节占用和触发原因。
 * @param {SessionLogReason} reason
 * @param {string} [traceId]
 * @return {SessionLogSnapshot}
 */
export function snapshotSessionLog(reason: SessionLogReason, traceId?: string): SessionLogSnapshot {
  const safeTrace = String(traceId || 'unknown').replace(/[^a-zA-Z0-9:_-]/g, '_')
  const logName = `session-${safeTrace}-${reason}.log`
  const href = typeof location !== 'undefined' ? location.href : ''
  const headerLines = [
    `# ${logName}`,
    '# 会话操作步骤与打印日志',
    `# reason: ${reason}`,
    `# traceId: ${traceId || ''}`,
    `# href: ${href}`,
    `# generated: ${new Date().toISOString()}`,
    `# steps: ${entries.length}`,
    `# bytes: ${totalBytes}/${SESSION_LOG_MAX_BYTES}`,
    '# 说明: 仅白屏或日志反馈时上传阿里云 OSS；上报只保留 logUrl，正文不进 Kafka/Mongo',
    '',
  ]
  const header = `${headerLines.join('\n')}\n`
  let body = entries.map((item) => item.text).join('')
  let events = `${header}${body}`
  let bytes = utf8Bytes(events)
  if (bytes > SESSION_LOG_MAX_BYTES) {
    const overflow = bytes - SESSION_LOG_MAX_BYTES
    let skip = 0
    let skippedBytes = 0
    for (const item of entries) {
      if (skippedBytes >= overflow) break
      skippedBytes += item.bytes
      skip += 1
    }
    body = entries.slice(skip).map((item) => item.text).join('')
    const trimmedHeader = header.replace(
      `# steps: ${entries.length}`,
      `# steps: ${Math.max(0, entries.length - skip)} (trimmed to 1.5MB)`,
    )
    events = `${trimmedHeader}${body}`
    bytes = utf8Bytes(events)
  }
  return { logName, events, bytes, steps: entries.length }
}
