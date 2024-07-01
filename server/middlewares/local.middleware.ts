import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { isDevEnv } from '@app/app.env'

/**
 * 用于本地开发登录
 * @export
 * @class LocalMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class LocalMiddleware implements NestMiddleware {
  /**
   * 接口和API访问都会生产session, 支持本地访问API和页面
   * @param {Request} request
   * @param {Response} response
   * @param {NextFunction} next
   * @return {*}
   * @memberof LocalMiddleware
   */
  use(request: Request, response: Response, next: NextFunction) {
    if (isDevEnv) {
    }
    return next()
  }
}
