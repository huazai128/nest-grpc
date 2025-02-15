import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { isProdEnv } from '@app/app.env'
import { CROSS_DOMAIN } from '@app/config'
import logger from '@app/utils/logger'

/**
 * 检查请求来源是否在允许列表中
 * @param source - 请求来源(origin或referer)
 * @param allowedList - 允许的来源列表
 * @returns {boolean} - 如果来源合法返回true,否则返回false
 */
const isAllowedSource = (source: string | undefined, allowedList: string[]): boolean => {
  // 如果没有来源信息则默认允许
  if (!source) return true
  // 检查来源是否包含在允许列表中的任一项
  return allowedList.some((allowed) => source.includes(allowed))
}

/**
 * 用于验证请求来源合法性的中间件
 * 主要用于防止跨站请求伪造(CSRF)攻击
 * @export
 * @class OriginMiddleware
 * @implements {NestMiddleware}
 */
@Injectable()
export class OriginMiddleware implements NestMiddleware {
  // API路径标识,用于区分API请求和页面请求
  private readonly API_PATH = '/api/'

  /**
   * 中间件处理函数
   * @param request - Express请求对象
   * @param response - Express响应对象
   * @param next - 下一个中间件函数
   * @returns {void | Response} - 如果验证通过则继续,否则返回错误响应
   */
  use(request: Request, response: Response, next: NextFunction): void | Response {
    // 仅在生产环境下进行来源验证,开发环境跳过验证
    if (isProdEnv) {
      const { origin, referer } = request.headers
      const { baseUrl } = request
      const allowedReferers = CROSS_DOMAIN.allowedReferer

      // 验证请求的origin和referer是否合法
      const isValidOrigin = isAllowedSource(origin, allowedReferers)
      const isValidReferer = isAllowedSource(referer, allowedReferers)
      const isApi = baseUrl.includes(this.API_PATH)

      // 如果origin和referer都不合法,则拒绝请求
      if (!isValidOrigin && !isValidReferer) {
        logger.warn(`非法请求来源: origin=${origin}, referer=${referer}`)

        // API请求返回JSON格式错误
        if (isApi) {
          return response.status(HttpStatus.UNAUTHORIZED).jsonp({
            status: HttpStatus.UNAUTHORIZED,
            message: '非法来源',
            error: null,
          })
        } else {
          // 页面请求返回错误页面
          return response.status(HttpStatus.UNAUTHORIZED).render('error', {
            message: '非法来源访问',
            error: {
              status: HttpStatus.UNAUTHORIZED,
              stack: '非法来源访问,请检查访问来源是否合法',
            },
          })
        }
      }
    }

    // 验证通过,继续下一个中间件
    return next()
  }
}
