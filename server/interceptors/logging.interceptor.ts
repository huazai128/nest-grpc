import { Injectable, NestInterceptor, CallHandler, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { isDevEnv } from '@app/app.env'
import { createLogger } from '@app/utils/logger'

// 创建日志记录器实例，设置作用域和是否显示时间
const logger = createLogger({ scope: 'LoggingInterceptor', time: isDevEnv })

/**
 * 日志拦截器 - 用于记录请求和响应的日志信息
 * @export
 * @class LoggingInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  /**
   * 拦截请求和响应
   * @param context - 执行上下文
   * @param next - 调用处理器
   * @returns Observable<any>
   */
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    // 获取请求处理Observable
    const call$ = next.handle()

    // 非开发环境直接返回，不记录日志
    if (!isDevEnv) {
      return call$
    }

    // 获取请求对象
    const request = context.switchToHttp().getRequest<Request>()

    // 构建请求日志内容
    const content = `${request.method} -> ${request.url}`

    // 记录请求开始日志
    logger.debug('>>> Request:', content)

    // 记录请求开始时间
    const startTime = Date.now()

    // 使用tap操作符记录响应日志和耗时
    return call$.pipe(
      tap(() => {
        const duration = Date.now() - startTime
        logger.debug('<<< Response:', content, `(${duration}ms)`)
      }),
    )
  }
}
