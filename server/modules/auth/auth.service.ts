import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AuthDTO } from './auth.dto'
import { lastValueFrom } from 'rxjs'
import {
  AuthService as AuthServiceT,
  LoginResponse,
  ValidateUserRequest,
  TokenRequest,
  TokenResponse,
} from '@app/protos/auth'

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
    return lastValueFrom(this.authService.login(data))
  }

  /**
   * 验证用户
   * @param {ValidateUserRequest} data
   * @return {*}  {Promise<LoginResponse>}
   * @memberof AuthService
   */
  public async validateUser(data: ValidateUserRequest): Promise<LoginResponse> {
    return lastValueFrom(this.authService.validateUser(data))
  }

  /**
   * 创建token
   * @param {TokenRequest} data
   * @return {*}  {Promise<TokenResponse>}
   * @memberof AuthService
   */
  public async creatToken(data: TokenRequest): Promise<TokenResponse> {
    return lastValueFrom(this.authService.creatToken(data))
  }
}
