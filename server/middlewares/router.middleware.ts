import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AuthService } from '@app/modules/auth/auth.service'
import logger from '@app/utils/logger'
import { get } from 'lodash'

/**
 * 拦截登录和未登录
 * @export
 * @class RouterMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class RouterMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(request: Request, response: Response, next: NextFunction) {
    const userInfo = get(request, 'session.user')
    const url = request.baseUrl
    request.isLogin = !!userInfo?.userId
    // 所有页面路由中不能包含/api/, 如果不没有登录，访问直接返回登录页面, 此处也可以加入白名单页面
    request.isRouter = !url.includes('/api/')
    // 如果登录了，访问登录页就重定向到首页
    if (request.isLogin && url === '/login' && !url.includes('/api/')) {
      return response.redirect('/')
    }
    logger.info(userInfo, 'userInfo')
    return next()
  }
}
