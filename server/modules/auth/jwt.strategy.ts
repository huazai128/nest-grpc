import { AUTH } from '@app/config'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'
import { AuthService } from './auth.service'
import { Request } from 'express'

/**
 * JWT策略
 * @export
 * @class JwtStrategy
 * @extends {PassportStrategy(Strategy)}
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req.cookies?.jwt || null]),
      ignoreExpiration: false,
      secretOrKey: AUTH.jwtTokenSecret,
    })
  }

  /**
   * 验证用户身份
   * @param payload JWT载荷
   * @returns 验证通过的用户信息
   * @throws UnauthorizedException 验证失败时抛出未授权异常
   */
  async validate(payload: any) {
    try {
      const user = await this.authService.validateUser(payload.data)
      if (!user) {
        throw new UnauthorizedException('用户验证失败')
      }
      return user
    } catch (error) {
      throw new UnauthorizedException('无效的token')
    }
  }
}
