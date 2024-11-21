import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@app/modules/auth/auth.service'
import { isDevEnv } from '@app/app.env'

/**
 * 用于本地开发登录
 * @export
 * @class LocalMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class LocalMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  /**
   * 接口和API访问都会生产session, 支持本地访问API和页面
   * @param {Request} request
   * @param {Response} response
   * @param {NextFunction} next
   * @return {*}
   * @memberof LocalMiddleware
   */
  async use(request: Request, response: Response, next: NextFunction) {
    if (isDevEnv) {
      const userInfo = {
        account: 'admin',
        userId: 1000000000,
      }
      const token = await this.authService.creatToken(userInfo)
      response.cookie('jwt', token.accessToken, {
        sameSite: true,
        httpOnly: true,
        // secure: true,
      })
      response.cookie('userId', userInfo.userId)
      // 强制注入cookie
      request.cookies['jwt'] = token.accessToken
      request.session.user = userInfo
    }
    return next()
  }
}
