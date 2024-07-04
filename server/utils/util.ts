import { Request } from 'express'
import { networkInterfaces } from 'os'
import { UAParser, IResult } from 'ua-parser-js'

/**
 * 获取服务端IP
 * @export
 * @return {*}
 */
export function getServerIp(): string | undefined {
  const interfaces = networkInterfaces()
  for (const devName in interfaces) {
    const iface = interfaces[devName] as Array<any>
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i]
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address
      }
    }
  }
}

/**
 * 解析UA
 * @export
 * @param {string} ua
 * @return {*}  {IResult}
 */
export function getUaInfo(ua: string): IResult {
  const parser = new UAParser()
  parser.setUA(ua)
  return parser.getResult()
}

/**
 * 获取客户端IP
 * @export
 * @param {Request} req
 * @return {*}  {string}
 */
export function getClientIp(req: Request): string | undefined {
  const ip =
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    req.ips[0]
  return ip.replace('::ffff:', '').replace('::1', '')?.split(',')?.[0] || undefined
}
