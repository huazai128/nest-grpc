import { Controller, Get, Post } from '@nestjs/common'

@Controller('/api/log')
export class LogController {
  @Get('list')
  getLogList() {
    console.log('')
    return { msg: '成功' }
  }

  @Post('multi')
  saveLogs() {
    console.log('=====')
    return {}
  }
}
