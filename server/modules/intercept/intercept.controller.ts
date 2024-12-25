import { Controller, Get, NotFoundException, Post } from '@nestjs/common'

@Controller('/api/')
export class InterceptController {
  @Get('*')
  getMethod() {
    throw new NotFoundException('当前接口不存在')
  }

  @Post('*')
  pushMethod() {
    throw new NotFoundException('当前接口不存在')
  }
}
