import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@app/modules/auth/auth.service'
import logger from '@app/utils/logger'
import { get } from 'lodash'

/**
 * 路由中间件 - 处理登录状态和路由拦截
 * @export
 * @class RouterMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class RouterMiddleware implements NestMiddleware {
  // API路径标识
  private readonly API_PATH = '/api/'
  // 登录页路径
  private readonly LOGIN_PATH = '/login'
  // 首页路径
  private readonly HOME_PATH = '/'

  constructor(private readonly authService: AuthService) {}

  async use(request: Request, response: Response, next: NextFunction) {
    const { baseUrl } = request
    const userInfo = get(request, 'session.user')

    // 设置登录状态
    request.isLogin = !!userInfo?.userId
    // 判断是否为页面路由
    request.isRouter = !baseUrl.includes(this.API_PATH)

    // 已登录用户访问登录页时重定向到首页
    if (request.isLogin && baseUrl === this.LOGIN_PATH && !baseUrl.includes(this.API_PATH)) {
      return response.redirect(this.HOME_PATH)
    }

    logger.info('当前用户信息:', userInfo)
    return next()
  }
}
