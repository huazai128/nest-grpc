import { AUTH } from '@app/config'
import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-jwt'
import { AuthService } from './auth.service'
import { Request } from 'express'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: (req: Request) => {
        // cookie 获取token
        return req.cookies['jwt']
      },
      secretOrKey: AUTH.jwtTokenSecret,
    })
  }

  /**
   * 验证用户
   * @param {*} payload
   * @return {*}
   * @memberof JwtStrategy
   */
  async validate(payload: any) {
    const res = await this.authService.validateUser(payload.data)
    return res
  }
}
