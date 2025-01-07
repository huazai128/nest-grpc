import { ExecutionContext, Injectable } from '@nestjs/common'
import { LoggedInGuard } from './logged-in.guard'
import { HttpUnauthorizedError } from '@app/errors/unauthorized.error'
import { Reflector } from '@nestjs/core'
import { Roles } from '@app/decorators/roles.decorator'
import { get } from 'lodash'
import { AuthInfo } from '@app/interfaces/auth.interface'

@Injectable()
export class RouterGuard extends LoggedInGuard {
  constructor(private reflector: Reflector) {
    super()
  }
  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.get(Roles, context.getHandler())
    if (!roles) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    // 目前还没有roles字段存储到session中，需要保存到session中
    const user = get(request, 'session.user')
    const res = await super.canActivate(context)
    return res as boolean
  }
  handleRequest(error, authInfo, errInfo) {
    if (authInfo && !error && !errInfo) {
      return authInfo
    } else {
      throw error || new HttpUnauthorizedError(errInfo?.message || '没有权限访问')
    }
  }
}
