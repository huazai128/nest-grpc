import { Request } from 'express'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { getClientIp, getUaInfo } from '@app/utils/util'
import { IResult } from 'ua-parser-js'
export interface QueryVisitor {
  ip: string | null
  ua?: string
  origin?: string
  referer?: string
  ua_result: Partial<IResult>
}

export interface QueryCookies {
  [key: string]: any
}

export interface QueryParamsResult {
  body: Record<string, string>
  params: Record<string, string>
  query: Record<string, string>
  cookies: QueryCookies
  visitor: QueryVisitor
  request: Request
}

/**
 * QueryParams 自定义装饰器，请求方法解析参数
 * @function QueryParams
 * @example `@QueryParams()`
 * @example `@QueryParams('query')`
 */
export const QueryParams = createParamDecorator(
  (field: keyof QueryParamsResult, ctx: ExecutionContext): QueryParamsResult => {
    const request = ctx.switchToHttp().getRequest<Request>()

    // 获取本地IP
    const ip = getClientIp(request)

    // 获取UA
    const ua = request.headers['user-agent'] || ''
    // 解析UA信息
    const ua_info = getUaInfo(ua)

    const visitor: QueryVisitor = {
      ip: ip || null,
      ua: ua,
      ua_result: ua_info,
      origin: request.headers.origin,
      referer: request.headers.referer,
    }

    const result = {
      params: request.params || {},
      query: request.query,
      cookies: request.cookies,
      visitor,
      request,
      body: request.body || {},
    }

    return field ? result[field] : (result as QueryParamsResult)
  },
)
