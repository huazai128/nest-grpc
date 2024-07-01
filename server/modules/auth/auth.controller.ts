import { Body, Controller, Post, Req, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthDTO } from './auth.dto'
import { Request, Response } from 'express'

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async adminLogin(@Req() req: Request, @Body() data: AuthDTO, @Res() res: Response) {
    const { accessToken, ...result } = await this.authService.login(data)
    res.cookie('jwt', accessToken, {
      sameSite: true,
      httpOnly: true,
    })
    res.cookie('userId', result.userId)
    // req.session.user = result
    return res.status(200).send({
      result: result,
      status: 'success',
      message: '登录成功',
    })
  }
}
