import { ExecutionContext, Injectable } from '@nestjs/common'
import { LoggedInGuard } from './logged-in.guard'
import { HttpUnauthorizedError } from '@app/errors/unauthorized.error'
import { Request } from 'express'

@Injectable()
export class ApiGuard extends LoggedInGuard {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>()
    return super.canActivate(context)
  }

  handleRequest(error, authInfo, errInfo) {
    const validToken = Boolean(authInfo)
    const emptyToken = !authInfo && errInfo?.message === 'No auth token'
    if (!error && (validToken || emptyToken)) {
      return authInfo || {}
    } else {
      throw error || new HttpUnauthorizedError()
    }
  }
}
