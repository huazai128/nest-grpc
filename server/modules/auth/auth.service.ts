import { AuthService as AuthServiceT, LoginResponse } from '@app/protos/auth'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AuthDTO } from './auth.dto'
import {} from 'rxjs/operators'
import { lastValueFrom, Observable } from 'rxjs'

@Injectable()
export class AuthService implements OnModuleInit {
  public authService: AuthServiceT
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
    // 此处返回的是Observable, 但是proto编译出来的返回是Promise
    const loginOb = this.authService.login(data) as unknown as Observable<LoginResponse>
    return lastValueFrom(loginOb)
  }
}
