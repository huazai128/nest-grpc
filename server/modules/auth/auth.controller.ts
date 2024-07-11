import { Body, Controller, Get, Inject, Post, Req, Res, Session } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthDTO } from './auth.dto'
import { Request, Response } from 'express'
import { SessionInfo } from '@app/interfaces/session.interfave'
import { AuthInfo } from '@app/interfaces/auth.interface'
import { MessagePattern } from '@nestjs/microservices'
import { RedisMicroserviceService } from '@app/processors/microservices/redis.microservice.service'

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly client: RedisMicroserviceService,
  ) {}

  @Post('login')
  public async adminLogin(
    @Req() req: Request,
    @Body() data: AuthDTO,
    @Session() session: SessionInfo,
    @Res() res: Response,
  ) {
    const { accessToken, ...result } = await this.authService.login(data)
    res.cookie('jwt', accessToken, {
      sameSite: true,
      httpOnly: true,
    })
    res.cookie('userId', result.userId)
    session.user = result as AuthInfo
    return res.status(200).send({
      result: result,
      status: 'success',
      message: '登录成功',
    })
  }

  /**
   * 获取用户列表
   * @return {*}
   * @memberof AuthController
   */
  @Get('list')
  getUserList() {
    const pattern = { cmd: 'getUserListRes' }
    console.log(pattern, 'pattern')
    return this.client.sendData(pattern, {})
  }
  /**
   * redis 微服务
   * @return {*}
   * @memberof AuthController
   */
  @MessagePattern({ cmd: 'getUserListRes' })
  async getUserListRes() {
    const userList = [{ id: 1, name: '测试' }]
    console.log('dasdad')
    return { userList }
  }
}
