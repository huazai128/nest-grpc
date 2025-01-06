import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SaveLogRequest, LogService as LogServiceT, LogList, ChartList } from '@app/protos/log'
import { lastValueFrom } from 'rxjs'
import { createLogger } from '@app/utils/logger'
import { QueryDTO } from '@app/protos/common/query_dto'
import { LogChartQueryDTO, LogPaginateQueryDTO } from './log.dto'
import { ChartItem } from '@app/protos/common/chart_item'

const Logger = createLogger({ scope: 'LogService', time: true })

@Injectable()
export class LogService implements OnModuleInit {
  public logService: LogServiceT

  constructor(@Inject('LOGPROTO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.logService = this.client.getService<LogServiceT>('LogService')
  }

  /**
   * 保存日志
   * @param {SaveLogRequest} data
   * @memberof LogService
   */
  async saveLog(data: SaveLogRequest) {
    try {
      // 不加await会报错。这里会存在问题，当大量数据过来会导致CPU和内存都会偏高告警。这里要使用kafaka处理好些
      await lastValueFrom(this.logService.saveLog(data as any))
    } catch (error) {
      Logger.error('错误信息:', error.code, error.message)
    }
  }

  /**
   * 获取所有日志数据
   * @param {LogPaginateQueryDTO} paginateQuery
   * @return {*}  {Promise<LogList>}
   * @memberof LogService
   */
  public async getLogs(paginateQuery: LogPaginateQueryDTO): Promise<LogList> {
    return await lastValueFrom(this.logService.getLogs(paginateQuery as unknown as QueryDTO))
  }

  /**
   * 通过游标获取数据
   * @param {LogPaginateQueryDTO} paginateQuery
   * @return {*}  {Promise<LogList>}
   * @memberof LogService
   */
  public async cursorPaginate(paginateQuery: LogPaginateQueryDTO): Promise<LogList> {
    return await lastValueFrom(this.logService.cursorPaginate(paginateQuery as unknown as QueryDTO))
  }

  /**
   * 查询统计数据
   * @param {LogChartQueryDTO} paginateQuery
   * @return {*}  {Promise<ChartList>}
   * @memberof LogService
   */
  public async getLogsChart(paginateQuery: LogChartQueryDTO): Promise<ChartList> {
    return await lastValueFrom(this.logService.getLogsChart(paginateQuery as unknown as QueryDTO))
  }
}
