import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogList, SaveLogRequest } from '@app/protos/log'
import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response as ExpressResponse } from 'express'
import { LogService } from './log.service'
import { LogIngestService } from './log-ingest.service'
import { LogChartQueryDTO, LogData, LogPaginateQueryDTO } from './log.dto'
import { ApiGuard } from '@app/guards/api.guard'
import { ChartItem } from '@app/protos/common/chart_item'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({ scope: 'LogController', time: true })

@Controller('/api/log')
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly logIngestService: LogIngestService,
  ) {}

  /**
   * 获取日志
   * @param {LogPaginateQueryDTO} query
   * @return {*}  {Promise<LogList>}
   * @memberof LogController
   */
  @Get()
  @Get('list')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取日志列表')
  getLogs(@Query() query: LogPaginateQueryDTO): Promise<LogList> {
    return this.logService.getLogs(query)
  }

  @Post()
  @Responsor.api()
  @Responsor.handle('单条日志上报')
  async postLog(
    @PlainBody() data: Partial<LogData>,
    @QueryParams('visitor') visitor: QueryVisitor,
    @Res() res: ExpressResponse,
  ) {
    const logData = {
      ...data,
      ip: visitor.ip || '',
      ua: visitor.ua,
      ua_result: visitor.ua_result,
    } as LogData
    this.logIngestService.kafkaSend(logData)
    return res.status(204).json()
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
    @Res() res: ExpressResponse,
  ) {
    this.logIngestService.ingestMultiLogs(body.logs, visitor)
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
    logger.info('getLogsByCursor', query)
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

  /**
   * 获取IP分析
   * @param {string} ip
   * @memberof LogController
   */
  @Get('ip')
  getIpAnalysis(@Query() { ip }: { ip: string }) {
    logger.info('getIpAnalysis', ip)
    return this.logService.getIpAnalysis(ip)
  }

  @Get('aggregationPathOrUlr')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('路径或URL聚合统计')
  getLogsAggregation(@Query() query: LogPaginateQueryDTO & { type?: string }) {
    return this.logService.getLogsAggregation(query)
  }

  @Get('getMemoryData')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('内存指标图表')
  getMemoryData(@Query() query: LogChartQueryDTO) {
    return this.logService.getMemoryData(query)
  }
}
