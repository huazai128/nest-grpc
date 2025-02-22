import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { AuthDTO } from './auth.dto'
import { lastValueFrom } from 'rxjs'
import { AuthService as AuthServiceT, LoginResponse, ValidateUserRequest } from '@app/protos/auth'
import { JwtService } from '@nestjs/jwt'
import { AUTH, isDevEnv } from '@app/config'
import { TokenInfo } from '@app/interfaces/auth.interface'
import { createLogger } from '@app/utils/logger'
import { MeasureAsyncTime } from '@app/decorators/async.decorator'

// 创建日志记录器实例
const Logger = createLogger({ scope: 'AuthController', time: isDevEnv })

/**
 * 认证服务类
 * 处理用户认证、JWT令牌生成和验证等功能
 * @class AuthService
 * @implements {OnModuleInit}
 */
@Injectable()
export class AuthService implements OnModuleInit {
  // gRPC认证服务客户端实例
  public authService: AuthServiceT

  constructor(
    @Inject('AUTHPROTO_PACKAGE') private readonly client: ClientGrpc,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 模块初始化时创建gRPC服务客户端
   * @memberof AuthService
   */
  onModuleInit() {
    this.authService = this.client.getService<AuthServiceT>('AuthService')
  }

  /**
   * 生成JWT访问令牌
   * @param {*} data - 要编码到令牌中的用户数据
   * @return {TokenInfo} 包含访问令牌和过期时间的对象
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
   * 用户登录
   * 调用gRPC服务进行身份验证,生成访问令牌
   * @param {AuthDTO} data - 登录凭证
   * @return {Promise<LoginResponse & TokenInfo>} 登录响应和令牌信息
   * @memberof AuthService
   */
  @MeasureAsyncTime
  public async login(data: AuthDTO): Promise<LoginResponse & TokenInfo> {
    // 调用gRPC登录服务
    const { userId, account } = await lastValueFrom(this.authService.login(data))
    Logger.log('gRPC 获取登录数据', { userId, account })
    // 生成访问令牌
    const token = this.creatToken({
      account: account,
      userId: userId,
    })
    // 返回合并的登录信息和令牌
    return {
      ...token,
      userId,
      account,
    }
  }

  /**
   * 验证用户身份
   * 调用gRPC服务验证用户信息
   * @param {ValidateUserRequest} data - 用户验证请求数据
   * @return {Promise<LoginResponse>} 验证响应
   * @memberof AuthService
   */
  @MeasureAsyncTime
  public async validateUser(data: ValidateUserRequest): Promise<LoginResponse> {
    return lastValueFrom(this.authService.validateUser(data))
  }

  /**
   * 验证JWT令牌并获取用户信息
   * @param {string} jwt - JWT令牌字符串
   * @return {Promise<any>} 解码后的令牌载荷
   * @memberof AuthService
   */
  @MeasureAsyncTime
  public async verifyAsync(jwt: string): Promise<any> {
    const payload = await this.jwtService.verifyAsync(jwt, {
      secret: AUTH.jwtTokenSecret,
    })
    return payload
  }
}
