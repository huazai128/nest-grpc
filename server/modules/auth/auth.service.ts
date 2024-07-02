import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AuthDTO } from './auth.dto'
import { lastValueFrom, Observable } from 'rxjs'
import { authproto } from '@app/protos/auth'

type AuthServiceT = authproto.AuthService
type LoginResponse = authproto.LoginResponse

@Injectable()
export class AuthService implements OnModuleInit {
  public authService: authproto.AuthService
  constructor(@Inject('AUTHPROTO_PACKAGE') private client: ClientGrpc) {}
  onModuleInit() {
    this.authService = this.client.getService<AuthServiceT>('AuthService')
  }

  /**
   * 登录
   * @param {AuthDTO} data
   * @return {*}  {Promise<LoginResponse>}
   * @memberof AuthService
   */
  public login(data: AuthDTO): Promise<LoginResponse> {
    return lastValueFrom(this.authService.login(data))
  }
}
