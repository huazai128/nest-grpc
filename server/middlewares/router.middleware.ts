import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@app/modules/auth/auth.service'
import logger from '@app/utils/logger'
import { get } from 'lodash'

/**
 * 用于路由权限控制
 * @export
 * @class RouterMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class RouterMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(request: Request, response: Response, next: NextFunction) {
    const userInfo = get(request, 'session.user')
    logger.info(userInfo, 'userInfo')
    return next()
  }
}
