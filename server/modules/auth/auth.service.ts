import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AuthDTO } from './auth.dto'
import { lastValueFrom } from 'rxjs'
import { AuthService as AuthServiceT, LoginResponse, ValidateUserRequest } from '@app/protos/auth'
import { JwtService } from '@nestjs/jwt'
import { AUTH, isDevEnv } from '@app/config'
import { TokenInfo } from '@app/interfaces/auth.interface'
import { createLogger } from '@app/utils/logger'
const Logger = createLogger({ scope: 'AuthController', time: isDevEnv })

@Injectable()
export class AuthService implements OnModuleInit {
  public authService: AuthServiceT

  constructor(
    @Inject('AUTHPROTO_PACKAGE') private readonly client: ClientGrpc,
    private readonly jwtService: JwtService,
  ) {}
  onModuleInit() {
    this.authService = this.client.getService<AuthServiceT>('AuthService')
  }

  /**
   * 生成token
   * @param {*} data
   * @return {*}  {TokenInfo}
   * @memberof AuthService
   */
  public creatToken(data): TokenInfo {
    const token = {
      accessToken: this.jwtService.sign({ data }),
      expiresIn: AUTH.expiresIn as number,
    }
    return token
  }

  /**
   * 登录
   * @param {AuthDTO} data
   * @return {*}  {Promise<LoginResponse>}
   * @memberof AuthService
   */
  public async login(data: AuthDTO): Promise<LoginResponse & TokenInfo> {
    const { userId, account } = await lastValueFrom(this.authService.login(data))
    Logger.log('gRPC 获取登录数据', { userId, account })
    const token = this.creatToken({
      account: account,
      userId: userId,
    })
    return {
      ...token,
      userId,
      account,
    }
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
   * 通过验证获取用户信息
   * @param {string} jwt
   * @return {*}  {Promise<any>}
   * @memberof AuthService
   */
  public async verifyAsync(jwt: string): Promise<any> {
    const payload = await this.jwtService.verifyAsync(jwt, {
      secret: AUTH.jwtTokenSecret,
    })
    return payload
  }
}
