import _isString from 'lodash/isString'
import { ExceptionFilter, Catch, HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common'
import { ResponseStatus, HttpResponseError, ExceptionInfo } from '@app/interfaces/response.interface'
import { UNDEFINED } from '@app/constants/value.constant'
import { isDevEnv } from '@app/app.env'

/**
 *
 * 1. 全局异常捕获器
 * 2. 捕获所有异常，并格式化错误消息为 <HttpErrorResponse>
 * 3. 仅处理 API 请求
 * 4. 非 API 请求直接返回
 * 5. 捕获 HTTP 异常
 * 6. 捕获所有异常
 * @class HttpExceptionFilter
 * @classdesc catch globally exceptions & formatting error message to <HttpErrorResponse>
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest()
    const response = host.switchToHttp().getResponse()

    // 仅处理 API 请求
    if (!request.url.includes('/api/')) {
      return
    }
    const exceptionStatus = exception?.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR
    const errorResponse: ExceptionInfo = exception.getResponse() as ExceptionInfo
    const errorMessage = _isString(errorResponse) ? errorResponse : errorResponse.message
    const errorInfo = _isString(errorResponse) ? null : errorResponse.error

    const data: HttpResponseError = {
      status: ResponseStatus.Error,
      message: errorMessage,
      error: errorInfo?.message || (_isString(errorInfo) ? errorInfo : JSON.stringify(errorInfo)),
      debug: isDevEnv ? errorInfo?.stack || exception.stack : UNDEFINED,
    }

    // default 404
    if (exceptionStatus === HttpStatus.NOT_FOUND) {
      data.error = data.error || `Not found`
      data.message = data.message || `Invalid API: ${request.method} > ${request.url}`
    }

    return response.status(errorInfo?.status || exceptionStatus).jsonp(data)
  }
}
