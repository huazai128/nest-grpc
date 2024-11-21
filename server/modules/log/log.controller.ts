import { Controller, Get } from '@nestjs/common'

@Controller('/api/log')
export class LogController {
  @Get('list')
  getLogList() {
    console.log()
  }
}
