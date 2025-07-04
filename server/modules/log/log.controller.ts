import { PlainBody } from '@app/decorators/body.decorator'
import { QueryParams, QueryVisitor } from '@app/decorators/params.decorator'
import { Responsor } from '@app/decorators/responsor.decorator'
import { LogList, SaveLogRequest } from '@app/protos/log'
import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response as ExpressResponse } from 'express'
import { LogService } from './log.service'
import { RedisService } from '@app/processors/redis/redis.service'
import { LogChartQueryDTO, LogData, LogPaginateQueryDTO } from './log.dto'
import { ApiGuard } from '@app/guards/api.guard'
import { ChartItem } from '@app/protos/common/chart_item'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({ scope: 'LogController', time: true })

const WEB_INFO_TIME = 3 * 24 * 60 * 60

const WEB_INFO = 'webInfo'

const PAGE_INFO = 'pageInfo'

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
    @Res() res: ExpressResponse,
  ) {
    const { logs } = body

    // 如果日志数组长度超过10，直接返回, 这里存在问题，就是数据量多，且日志数据量很大，导致内存占用过高. 所以约定上报日志数量不超过10条

    // 不需要等所有的日志处理完成，直接返回
    logs.map(async (item) => {
      const cacheKey = `WEB_INFO:${item.traceId}`
      const pageCacheKey = `PAGE_INFO:${item.traceId}`

      if (item.category === WEB_INFO && item.traceId) {
        // 缓存基础网页信息3天
        await this.cacheService.set(cacheKey, item, WEB_INFO_TIME)
      } else if (item.category === PAGE_INFO && item.traceId) {
        // 缓存页面信息3天
        await this.cacheService.set(pageCacheKey, item, WEB_INFO_TIME)
      } else {
        // 获取缓存的基础信息并合并
        const webInfo = (await this.cacheService.get(cacheKey)) || {}
        const pageInfo = (await this.cacheService.get(pageCacheKey)) || {}
        // 合并日志数据
        const logData = {
          ...webInfo,
          ...pageInfo,
          ...item,
          ip: visitor.ip || '',
          ua: visitor.ua,
        }

        logger.info(`合并日志数据${item.reportsType}:`, logData)

        await this.logService.saveLog(logData as SaveLogRequest)
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
}
