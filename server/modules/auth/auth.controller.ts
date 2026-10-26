import { RedisMicroserviceService } from '@app/processors/microservices/redis.microservice.service'
import { SessionInfo } from '@app/interfaces/session.interfave'
import { MessagePattern } from '@nestjs/microservices'
import { AuthInfo } from '@app/interfaces/auth.interface'
import { Body, Controller, Get, Post, Query, Req, Res, Session, UseGuards } from '@nestjs/common'
import { createLogger } from '@app/utils/logger'
import { USER_LOGIN } from '@app/constants/pattern.constant'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { isDevEnv } from '@app/config'
import { AuthDTO } from './auth.dto'
import { ApiGuard } from '@app/guards/api.guard'
import { Responsor } from '@app/decorators/responsor.decorator'
import { ResponseStatus } from '@app/interfaces/response.interface'

const Logger = createLogger({ scope: 'AuthController', time: isDevEnv })

/**
 * 认证控制器（路径与 monitor-admin 对齐：/api/login、/api/user）
 */
@Controller('api')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly client: RedisMicroserviceService,
  ) {}

  @Post('login')
  @Responsor.api()
  @Responsor.handle('登录')
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
      status: ResponseStatus.Success,
      message: '登录成功',
    })
  }

  @Get('user')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取用户信息')
  public async getUserInfo(@Query('id') id: string) {
    return this.authService.getUserById(Number(id))
  }

  @Post('auth/login')
  public async adminLoginLegacy(
    @Req() req: Request,
    @Body() data: AuthDTO,
    @Session() session: SessionInfo,
    @Res() res: Response,
  ) {
    return this.adminLogin(req, data, session, res)
  }

  @Get('auth/list')
  getUserList() {
    const pattern = { cmd: 'getUserListRes' }
    return this.client.sendData(pattern, {})
  }

  @MessagePattern(USER_LOGIN)
  handleLogin() {
    Logger.log('用户登录消息触发')
    const userList = [{ id: 1, name: '测试用户' }]
    return { userList }
  }
}
