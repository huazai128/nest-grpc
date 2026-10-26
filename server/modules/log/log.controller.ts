import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogList } from '@app/protos/log'
import { BadRequestException, Controller, Get, Post, Query, Req, Res, ServiceUnavailableException, UseGuards } from '@nestjs/common'
import { Request as ExpressRequest, Response as ExpressResponse } from 'express'
import rawbody from 'raw-body'
import { LogService } from './log.service'
import { LogIngestService } from './log-ingest.service'
import { OssService } from '@app/processors/oss/oss.service'
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
    private readonly ossService: OssService,
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
    await this.logIngestService.ingestOne(logData)
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
    @PlainBody() body: { logs?: Partial<LogData>[]; siteId?: string; traceId?: string },
    @QueryParams('visitor') visitor: QueryVisitor,
    @Res() res: ExpressResponse,
  ) {
    await this.logIngestService.ingestMultiLogs(body || {}, visitor)
    return res.status(204).json()
  }

  /**
   * 上传会话 .log 到阿里云 OSS，返回链接。SDK 在白屏 / 反馈时先调这里，再上报 logUrl。
   * @param {ExpressRequest} req
   */
  @Post('session-file')
  @Responsor.api()
  @Responsor.handle('上传会话日志')
  async uploadSessionFile(@Req() req: ExpressRequest) {
    if (!this.ossService.isEnabled()) {
      throw new ServiceUnavailableException('OSS 未配置')
    }
    const logNameHeader = String(req.headers['x-session-log-name'] || '')
    const logName = logNameHeader.replace(/[^a-zA-Z0-9._:-]/g, '_') || 'session.log'
    const reason = String(req.headers['x-session-log-reason'] || '')
    const siteId = String(req.headers['x-site-id'] || '')
    const body = (await rawbody(req, { limit: '2mb', encoding: 'utf8' })).trim()
    if (!body) {
      throw new BadRequestException('会话日志为空')
    }
    const put = await this.ossService.putSessionLog({
      logName,
      body,
      siteId,
      reason,
    })
    return {
      logName,
      logUrl: put.logUrl,
      bytes: Buffer.byteLength(body, 'utf8'),
    }
  }

  /**
   * 上传 rrweb JSON 到阿里云 OSS，返回链接。SDK 在录屏检查点先调这里，再上报 eventsUrl。
   * @param {ExpressRequest} req
   */
  @Post('record-file')
  @Responsor.api()
  @Responsor.handle('上传录屏片段')
  async uploadRecordFile(@Req() req: ExpressRequest) {
    if (!this.ossService.isEnabled()) {
      throw new ServiceUnavailableException('OSS 未配置')
    }
    const monitorId = String(req.headers['x-record-id'] || 'video').replace(/[^a-zA-Z0-9._:-]/g, '_')
    const siteId = String(req.headers['x-site-id'] || '')
    const body = (await rawbody(req, { limit: '3mb', encoding: 'utf8' })).trim()
    if (!body) {
      throw new BadRequestException('录屏数据为空')
    }
    const put = await this.ossService.putRrweb({
      monitorId,
      body,
      siteId,
    })
    return {
      monitorId,
      eventsUrl: put.eventsUrl,
      bytes: Buffer.byteLength(body, 'utf8'),
    }
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
