import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogRequest } from '@app/protos/log'
import { Controller, Get, Post, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller('/api/log')
export class LogController {
  @Get('list')
  getLogList() {
    console.log('=====')
    return { msg: '成功' }
  }

  @Post('multi')
  @Responsor.api()
  @Responsor.handle('多条日志上报')
  postMultiLogs(
    @PlainBody() body: { logs: Partial<LogRequest>[] },
    @QueryParams('visitor') visitor: QueryVisitor,
    @Res() res: Response,
  ) {
    const { logs } = body
    logs.forEach(() => {})
    return res.status(204).json()
  }
}
