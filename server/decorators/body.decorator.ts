import rawbody from 'raw-body'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/** @type {*}
 * 处理post text/plain 数据
 */
export const PlainBody = createParamDecorator(async (data: any, context: ExecutionContext) => {
  const req = context.switchToHttp().getRequest()
  if (!req.readable) {
    if (req.body && typeof req.body === 'object') return req.body
    if (typeof req.body === 'string' && req.body) {
      return JSON.parse(req.body)
    }
    return null
  }
  const body = (await rawbody(req)).toString('utf8').trim()
  return JSON.parse(body)
})
