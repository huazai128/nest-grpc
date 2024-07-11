import { isDevEnv } from '@app/app.env'
import { AuthService } from '@app/modules/auth/auth.service'
import logger from '@app/utils/logger'
import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { get } from 'lodash'

/**
 * 用于app内嵌页面授权访问
 * @export
 * @class OriginMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class AppMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(request: Request, response: Response, next: NextFunction) {
    // isApp 这里还要加上一个app 来源判断，在UA或者cookie 加上一个标识用于判断是否为内部APP.
    // if (!isDevEnv && isApp) {
    if (!isDevEnv) {
      logger.info('来源为app内嵌h5页面授权')
      // 把用户相关信息注入到UA或者cookie中，通过UA或者cookie获取用户信息进行授权登录。
      // 确保服务端生成的jwt和node服务规则一致，如果不行可以通过grpc调用服务获取数据
      const jwt = get(request, 'cookies.jwt')
      if (jwt) {
        try {
          const { data } = await this.authService.verifyAsync(jwt)
          response.cookie('jwt', data.accessToken, {
            sameSite: true,
            httpOnly: true,
            // secure: true,
          })
          response.cookie('userId', data.userId)
          // 强制注入cookie
          request.cookies['jwt'] = data.accessToken
          request.session.user = data
        } catch (error) {
          throw new Error('抛出异常，如果是api, 直接报错，如果是页面就跳转到登录页面')
        }
      }
    }
    return next()
  }
}
