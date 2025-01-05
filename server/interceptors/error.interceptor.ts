import { getResponsorOptions } from '@app/decorators/responsor.decorator'
import { CustomError } from '@app/errors/custom.error'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

/**
 * 异常映射
 * @class ErrorInterceptor
 */
@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const call$ = next.handle()
    const target = context.getHandler()
    const { errorCode, errorMessage } = getResponsorOptions(target)
    return call$.pipe(
      catchError(({ response, ...error }) => {
        const msg = Array.isArray(response?.message) ? response?.message[0] : null
        return throwError(
          () =>
            new CustomError(
              { message: msg || error.message || errorMessage || '请求失败', error },
              error.status || errorCode,
            ),
        )
      }),
    )
  }
}
