import { Controller, Get, Post } from '@nestjs/common'

@Controller('/api/log')
export class LogController {
  @Get('list')
  getLogList() {
    console.log()
  }

  @Post('multi')
  saveLogs() {
    console.log('=====')
  }
}
