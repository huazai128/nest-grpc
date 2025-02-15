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
import { ChartItem } from '@app/protos/common/chart_item'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({ scope: 'LogController', time: true })

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
    // 遍历日志并处理
    logs.map(async (item) => {
      logger.info('批量上传日志:', item)
      if (item.category === WEB_INFO && item.traceId) {
        this.cacheService.set(item.traceId, item, 3 * 24 * 60 * 60)
      } else {
        const cacheKey = `WEB_INFO:${item.traceId}` // 使用组合键确保唯一性
        const webInfo = (await this.cacheService.get(cacheKey)) || {}
        logger.info('批量上传日志通用信息:', webInfo)
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
    return this.logService.cursorPaginate(query)
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
  getLogsChart(@Query() query: LogChartQueryDTO): Promise<ChartItem[]> {
    return this.logService.getLogsChart(query)
  }
}
