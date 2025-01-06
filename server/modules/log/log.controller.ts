import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogList, SaveLogRequest } from '@app/protos/log'
import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { LogService } from './log.service'
import { RedisService } from '@app/processors/redis/redis.service'
import { LogChartQueryDTO, LogData, LogPaginateQueryDTO } from './log.dto'
import { ApiGuard } from '@app/guards/api.guard'

const WEB_INFO = 'webInfo'

@Controller('/api/log')
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly cacheService: RedisService,
  ) {}

  /**
   * 获取日志
   * @param {LogPaginateQueryDTO} query
   * @return {*}  {Promise<LogList>}
   * @memberof LogController
   */
  @Get('list')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取日志列表')
  getLogs(@Query() query: LogPaginateQueryDTO): Promise<LogList> {
    console.log(query, 'query=======')
    return this.logService.getLogs(query)
  }

  /**
   * 批量上传日志
   * @param {{ logs: Partial<LogData>[] }} body
   * @param {QueryVisitor} visitor
   * @param {Response} res
   * @return {*}
   * @memberof LogController
   */
  @Post('multi')
  @Responsor.api()
  @Responsor.handle('批量上传日志')
  async postMultiLogs(
    @PlainBody() body: { logs: Partial<LogData>[] },
    @QueryParams('visitor') visitor: QueryVisitor,
    @Res() res: Response,
  ) {
    const { logs } = body
    let webInfo = logs.find((item) => item.category === WEB_INFO)
    // 这里存在traceId 肯能不一致的问题，需要优化
    if (webInfo && webInfo.traceId) {
      // 缓存页面基础信息，防止重复传递占用请求资源
      this.cacheService.set(webInfo.traceId, webInfo, 3 * 24 * 60 * 60)
    } else if (logs[0]?.traceId) {
      const traceId = logs[0]?.traceId
      webInfo = await this.cacheService.get(traceId)
    }
    logs.forEach((item: SaveLogRequest) => {
      if (item.category !== WEB_INFO) {
        // 要覆盖这里的类型category=WEB_INFO, 因为这里只是用于存储公共的上报基础信息
        const nData = { ...webInfo, ...item, ip: visitor.ip, ua_result: visitor.ua_result } as SaveLogRequest
        this.logService.saveLog(nData)
      }
    })
    return res.status(204).json()
  }

  /**
   * 通过游标获取日志
   * @param {LogPaginateQueryDTO} query
   * @memberof LogController
   */
  @Get('/cursor')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取日志列表游标分页')
  getLogsByCursor(@Query() query: LogPaginateQueryDTO) {
    console.log(query, 'query=====')
  }

  /**
   * 获取统计数据
   * @param {LogChartQueryDTO} query
   * @memberof LogController
   */
  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取图表数据')
  getLogsChart(@Query() query: LogChartQueryDTO) {
    console.log(query)
  }
}
