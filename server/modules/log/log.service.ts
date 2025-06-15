import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SaveLogRequest, LogService as LogServiceT, LogList, IPLocationRequest } from '@app/protos/log'
import { lastValueFrom } from 'rxjs'
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

      // 使用更高效的方式估算数据大小，避免完整序列化
      const estimatedSize = this.estimateDataSize(data)
      const maxSize = 4 * 1024 * 1024 // 4MB阈值

      if (estimatedSize > maxSize) {
        // 延迟导入，避免不必要的模块加载
        const { ReplaySubject } = await import('rxjs')

        // 只在需要时进行完整序列化
        const serializedData = JSON.stringify(data)
        const actualSize = serializedData.length

        // 如果实际大小小于阈值，直接发送
        if (actualSize <= maxSize) {
          await lastValueFrom(this.logService.saveLog(data as any))
          return
        }

        const chunks$ = new ReplaySubject<any>()
        const chunkSize = 1024 * 1024 // 1MB per chunk
        const totalChunks = Math.ceil(actualSize / chunkSize)

        try {
          // 使用 Promise.resolve() 包装同步操作，提高性能
          await Promise.resolve().then(() => {
            // 批量处理分片，减少循环开销
            for (let i = 0; i < totalChunks; i++) {
              const start = i * chunkSize
              const end = Math.min(start + chunkSize, actualSize)
              const chunk = serializedData.slice(start, end)

              chunks$.next({
                chunkIndex: i,
                totalChunks,
                data: chunk,
                isLastChunk: i === totalChunks - 1,
              })
            }
            chunks$.complete()
          })

          // 发送分片数据流到grpc服务
          await lastValueFrom(this.logService.saveLogChunked?.(chunks$.asObservable()))
        } catch (error) {
          chunks$.error(error)
          Logger.error('saveLog chunked error:', error)
          throw error
        }
      } else {
        // 数据较小，直接发送
        await lastValueFrom(this.logService.saveLog(data as any))
      }
    } catch (error) {
      Logger.error('saveLog grpc错误信息:', error.code, error.message)
      throw error
    }
  }

  /**
   * 估算数据大小，避免完整序列化的性能开销
   * @private
   */
  private estimateDataSize(data: any): number {
    if (!data) return 0

    const estimateValue = (value: any): number => {
      if (value === null || value === undefined) return 4
      if (typeof value === 'string') return value.length * 2 // UTF-16
      if (typeof value === 'number') return 8
      if (typeof value === 'boolean') return 4
      if (Array.isArray(value)) {
        return value.reduce((acc, item) => acc + estimateValue(item), 20)
      }
      if (typeof value === 'object') {
        return Object.entries(value).reduce((acc, [key, val]) => {
          return acc + key.length * 2 + estimateValue(val)
        }, 20)
      }
      return 50 // 默认估算值
    }

    return estimateValue(data)
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
      const t = new Date()
      const data = await lastValueFrom(this.logService.getLogsByCursor(paginateQuery as unknown as QueryDTO))
      const t2 = new Date()
      Logger.info('cursorPaginate grpc请求时间:', t2.getTime() - t.getTime())
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
