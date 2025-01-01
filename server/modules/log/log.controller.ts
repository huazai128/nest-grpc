import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogRequest } from '@app/protos/log'
import { Controller, Get, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { LogService } from './log.service'
import { RedisService } from '@app/processors/redis/redis.service'

const WEB_INFO = 'webInfo'

@Controller('/api/log')
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly cacheService: RedisService,
  ) {}

  @Get('list')
  getLogList() {
    return { msg: '成功' }
  }

  @Post('multi')
  @Responsor.api()
  @Responsor.handle('批量上传日志')
  async postMultiLogs(
    @PlainBody() body: { logs: Partial<LogRequest>[] },
    @QueryParams('visitor') visitor: QueryVisitor,
    @Res() res: Response,
  ) {
    const { logs } = body
    let webInfo = logs.find((item) => item.category === WEB_INFO)
    if (webInfo && webInfo.traceId) {
      // 缓存页面基础信息，防止重复传递占用请求资源
      this.cacheService.set(webInfo.traceId, webInfo, 3 * 24 * 60 * 60)
    } else if (logs[0]?.traceId) {
      const traceId = logs[0]?.traceId
      webInfo = await this.cacheService.get(traceId)
    }
    logs.forEach((item: LogRequest) => {
      if (item.category !== WEB_INFO) {
        // 要覆盖这里的类型category=WEB_INFO, 这个只是用于存储公用的上报基础信息
        const nData = { ...webInfo, ...item, ip: visitor.ip, ua_result: visitor.ua_result } as LogRequest
        this.logService.saveLog(nData)
      }
    })
    return res.status(204).json()
  }
}
