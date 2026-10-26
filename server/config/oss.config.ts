/**
 * 阿里云 OSS：会话 .log / rrweb 上传配置，全部从环境变量读取，不写密钥进仓库。
 * 未配齐 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET 时视为关闭。
 */
export type OssConfig = {
  region: string
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  endpoint: string
  prefix: string
  rrwebPrefix: string
  acl: string
  cdnHost: string
}

/**
 * 规范化 region：cn-hangzhou 与 oss-cn-hangzhou 都能用。
 * @param {string} raw
 * @return {string}
 */
function normalizeRegion(raw: string): string {
  const value = raw.trim() || 'oss-cn-hangzhou'
  return value.startsWith('oss-') ? value : `oss-${value}`
}

/**
 * 目录前缀，保证以 / 结尾。
 * @param {string} raw
 * @param {string} fallback
 * @return {string}
 */
function withSlash(raw: string, fallback: string): string {
  const value = (raw || fallback).trim() || fallback
  return value.endsWith('/') ? value : `${value}/`
}

/**
 * 读当前进程的 OSS 配置。
 * @return {OssConfig}
 */
export function getOssConfig(): OssConfig {
  const region = normalizeRegion(process.env.OSS_REGION || '')
  const endpoint = (process.env.OSS_ENDPOINT || `${region}.aliyuncs.com`).replace(/^https?:\/\//, '').replace(/\/$/, '')
  return {
    region,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
    endpoint,
    prefix: withSlash(process.env.OSS_PREFIX || '', 'session-logs/'),
    rrwebPrefix: withSlash(process.env.OSS_RRWEB_PREFIX || '', 'rrweb/'),
    acl: process.env.OSS_ACL || 'public-read',
    cdnHost: (process.env.OSS_CDN_HOST || '').replace(/\/$/, ''),
  }
}

/**
 * 三项凭证齐全才允许上传。
 * @param {OssConfig} [config]
 * @return {boolean}
 */
export function isOssEnabled(config = getOssConfig()): boolean {
  return Boolean(config.accessKeyId && config.accessKeySecret && config.bucket)
}
