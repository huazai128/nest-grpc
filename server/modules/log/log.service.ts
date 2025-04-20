import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  SaveLogRequest,
  LogService as LogServiceT,
  LogList,
  IPLocationRequest,
  IPLocationResponse,
} from '@app/protos/log'
import { lastValueFrom, Observable } from 'rxjs'
import { createLogger } from '@app/utils/logger'
import { QueryDTO } from '@app/protos/common/query_dto'
import { LogChartQueryDTO, LogPaginateQueryDTO } from './log.dto'
import { ChartItem } from '@app/protos/common/chart_item'
import { MeasureAsyncTime } from '@app/decorators/async.decorator'

const Logger = createLogger({ scope: 'LogService', time: true })

/**
 * 日志服务
 * @class LogService
 * @implements {OnModuleInit}
 */
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
  @MeasureAsyncTime
  async saveLog(data: SaveLogRequest) {
    try {
      Logger.info('saveLog grpc请求数据:', data)
      // 不加await会报错。这里会存在问题，当大量数据过来会导致CPU和内存都会偏高告警。这里要使用kafaka处理好些。
      await lastValueFrom(this.logService.saveLog(data as any))
    } catch (error) {
      Logger.error('saveLog grpc错误信息:', error.code, error.message)
    }
  }

  /**
   * 获取所有日志数据
   * @param {LogPaginateQueryDTO} paginateQuery
   * @return {*}  {Promise<LogList>}
   * @memberof LogService
   */
  @MeasureAsyncTime
  public async getLogs(paginateQuery: LogPaginateQueryDTO): Promise<LogList> {
    try {
      return await lastValueFrom(this.logService.getLogs(paginateQuery as unknown as QueryDTO))
    } catch (error) {
      Logger.error('getLogs grpc错误信息:', error.code, error.message)
      throw new BadRequestException({ code: error.code, message: '调用getLogs grpc方法获取出错了' })
    }
  }

  /**
   * 通过游标获取数据
   * @param {LogPaginateQueryDTO} paginateQuery
   * @return {*}  {Promise<LogList>}
   * @memberof LogService
   */
  public async cursorPaginate(paginateQuery: LogPaginateQueryDTO): Promise<LogList> {
    try {
      const data = await lastValueFrom(this.logService.getLogsByCursor(paginateQuery as unknown as QueryDTO))
      return data
    } catch (error) {
      Logger.error('cursorPaginate grpc错误信息:', error.code, error.message)
      throw new BadRequestException({ code: error.code, message: '调用cursorPaginate grpc方法获取出错了' })
    }
  }

  /**
   * 查询统计数据
   * @param {LogChartQueryDTO} paginateQuery
   * @return {*}  {Promise<ChartList>}
   * @memberof LogService
   */
  public async getLogsChart(paginateQuery: LogChartQueryDTO): Promise<ChartItem[]> {
    try {
      const data = await lastValueFrom(this.logService.getLogsChart(paginateQuery as unknown as QueryDTO))
      return data.data
    } catch (error) {
      Logger.error('getLogsChart grpc错误信息:', error.code, error.message)
      throw new BadRequestException({ code: error.code, message: '调用getLogsChart grpc方法获取出错了' })
    }
  }

  /**
   * 获取IP分析
   * @param {string} ip
   * @return {*}  {Promise<IPLocationResponse>}
   * @memberof LogService
   */
  public async getIpAnalysis(ip: string) {
    try {
      const data = await lastValueFrom(this.logService.handleIPLocation({ ip } as IPLocationRequest))
      return data
    } catch (error) {
      Logger.error('getIpAnalysis grpc错误信息:', error.code, error.message)
      throw new BadRequestException({ code: error.code, message: '调用getIpAnalysis grpc方法获取出错了' })
    }
  }
}
