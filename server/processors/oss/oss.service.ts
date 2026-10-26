import { Injectable } from '@nestjs/common'
import { createHash, createHmac, randomUUID } from 'crypto'
import { getOssConfig, isOssEnabled, OssConfig } from '@app/config/oss.config'
import { createLogger } from '@app/utils/logger'
import { isProdEnv } from '@app/config'

const logger = createLogger({ scope: 'OssService', time: isProdEnv ? false : true })

/** 会话 .log 上传结果：对象键 + 可访问链接 */
export type SessionLogPutResult = {
  key: string
  logUrl: string
}

/**
 * 阿里云 OSS PutObject（V1 签名）。会话 .log 走对象存储，Kafka/Mongo 只留链接。
 */
@Injectable()
export class OssService {
  /**
   * 是否已配置 OSS 凭证。
   * @return {boolean}
   */
  isEnabled(): boolean {
    return isOssEnabled()
  }

  /**
   * 上传会话 .log 正文，返回对象 URL。
   * @param {{ logName: string, body: string, siteId?: string, reason?: string }} input
   * @return {Promise<SessionLogPutResult>}
   */
  async putSessionLog(input: {
    logName: string
    body: string
    siteId?: string
    reason?: string
  }): Promise<SessionLogPutResult> {
    const config = getOssConfig()
    if (!isOssEnabled(config)) {
      throw new Error('OSS 未配置')
    }
    const key = this.buildObjectKey(config, input)
    const buffer = Buffer.from(input.body, 'utf8')
    const contentType = 'text/plain; charset=utf-8'
    const date = new Date().toUTCString()
    const md5 = createHash('md5').update(buffer).digest('base64')
    const ossHeaders: Record<string, string> = {}
    if (config.acl) {
      ossHeaders['x-oss-object-acl'] = config.acl
    }
    const resource = `/${config.bucket}/${key}`
    const canonicalOss = Object.keys(ossHeaders)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `${name}:${ossHeaders[name]}\n`)
      .join('')
    const stringToSign = `PUT\n${md5}\n${contentType}\n${date}\n${canonicalOss}${resource}`
    const signature = createHmac('sha1', config.accessKeySecret).update(stringToSign).digest('base64')
    const host = `${config.bucket}.${config.endpoint}`
    const url = `https://${host}/${key.split('/').map(encodeURIComponent).join('/')}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Date: date,
        'Content-Type': contentType,
        'Content-MD5': md5,
        Authorization: `OSS ${config.accessKeyId}:${signature}`,
        ...ossHeaders,
      },
      body: buffer,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      logger.error('OSS PutObject 失败', response.status, detail.slice(0, 500))
      throw new Error(`OSS PutObject ${response.status}`)
    }
    const logUrl = this.publicUrl(config, key)
    logger.info('OSS 会话日志已上传', { key, bytes: buffer.length, reason: input.reason })
    return { key, logUrl }
  }

  /**
   * 对象键：prefix/年/月/日/siteId/uuid-logName，避免覆盖和猜测。
   * @param {OssConfig} config
   * @param {{ logName: string, siteId?: string }} input
   * @return {string}
   */
  private buildObjectKey(
    config: OssConfig,
    input: { logName: string; siteId?: string },
  ): string {
    const now = new Date()
    const y = now.getUTCFullYear()
    const m = String(now.getUTCMonth() + 1).padStart(2, '0')
    const d = String(now.getUTCDate()).padStart(2, '0')
    const site = String(input.siteId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64)
    const name = String(input.logName || 'session.log').replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${config.prefix}${y}/${m}/${d}/${site}/${randomUUID()}-${name}`
  }

  /**
   * 入库链接：优先 CDN，否则 bucket.endpoint/key。
   * @param {OssConfig} config
   * @param {string} key
   * @return {string}
   */
  private publicUrl(config: OssConfig, key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/')
    if (config.cdnHost) {
      const host = config.cdnHost.replace(/^https?:\/\//, '')
      return `https://${host}/${encoded}`
    }
    return `https://${config.bucket}.${config.endpoint}/${encoded}`
  }
}

/**
 * 是否为会话 .log 载荷。rrweb 的 events 是 JSON 数组，不会命中。
 * @param {unknown} logName
 * @param {unknown} events
 * @return {boolean}
 */
export function isSessionLogPayload(logName?: unknown, events?: unknown): boolean {
  if (typeof logName === 'string' && /^session-.+\.log$/i.test(logName)) return true
  if (typeof events === 'string' && events.startsWith('# session-')) return true
  return false
}
