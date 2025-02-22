import { RedisMicroserviceService } from '@app/processors/microservices/redis.microservice.service'
import { SessionInfo } from '@app/interfaces/session.interfave'
import { MessagePattern } from '@nestjs/microservices'
import { AuthInfo } from '@app/interfaces/auth.interface'
import { Body, Controller, Get, Post, Req, Res, Session } from '@nestjs/common'
import { createLogger } from '@app/utils/logger'
import { USER_LOGIN } from '@app/constants/pattern.constant'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { isDevEnv } from '@app/config'
import { AuthDTO } from './auth.dto'

const Logger = createLogger({ scope: 'AuthController', time: isDevEnv })

/**
 * 认证控制器
 * 处理用户登录认证相关的HTTP请求
 */
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly client: RedisMicroserviceService,
  ) {}

  /**
   * 管理员登录接口
   * @param req - Express请求对象
   * @param data - 登录信息DTO
   * @param session - 会话信息
   * @param res - Express响应对象
   * @returns 登录结果响应
   */
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
   * @returns 用户列表数据
   */
  @Get('list')
  getUserList() {
    const pattern = { cmd: 'getUserListRes' }
    return this.client.sendData(pattern, {})
  }

  /**
   * 处理用户登录消息
   * 用于微服务间通信的消息处理器
   * @returns 测试用户列表数据
   */
  @MessagePattern(USER_LOGIN)
  handleLogin() {
    Logger.log('用户登录消息触发')
    const userList = [{ id: 1, name: '测试用户' }]
    return { userList }
  }
}
