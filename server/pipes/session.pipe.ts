import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common'
import { get } from 'lodash'
import { Request } from 'express'
import { AuthInfo } from '@app/interfaces/auth.interface'

/**
 * session 解析
 * @export
 * @class SessionPipe
 * @implements {PipeTransform<IRequest, IRequest>}
 */
@Injectable()
export class SessionPipe implements PipeTransform<Request, Request> {
  transform(req: Request, metadata: ArgumentMetadata): Request {
    const user = get(req, 'session.user') as unknown as AuthInfo
    req.isLogin = !!user?.userId
    return req
  }
}
