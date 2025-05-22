import { Inject, Injectable } from '@nestjs/common'
import { createLogger } from '@app/utils/logger'
import { MeasureAsyncTime } from '@app/decorators/async.decorator'
import { ClientGrpc } from '@nestjs/microservices'
import { ErrorService as ErrorServiceT, GetErrorInfoRequest } from '@app/protos/error'
import { lastValueFrom } from 'rxjs'
const Logger = createLogger({ scope: 'ErrorService', time: true })

/**
 * 错误服务
 * @class ErrorService
 */
@Injectable()
export class ErrorService {
  public errorService: ErrorServiceT
  constructor(@Inject('ERROR_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.errorService = this.client.getService<ErrorServiceT>('ErrorService')
  }

  // @MeasureAsyncTime
  // async getErrorLogs(query: ErrorPaginateDTO) {
  //   const res = await lastValueFrom(this.errorService.getErrorLogs(query))
  //   Logger.info('getErrorLogs', res)
  //   return res
  // }

  // @MeasureAsyncTime
  // async getErrorChart() {
  //   const res = await lastValueFrom(this.errorService.getErrorChart({}))
  //   Logger.info('getErrorChart', res)
  //   return res
  // }

  // @MeasureAsyncTime
  // async getErrorOverviewList() {
  //   const res = await lastValueFrom(this.errorService.getErrorOverviewList({}))
  //   Logger.info('getErrorOverviewList', res)
  //   return res
  // }

  // @MeasureAsyncTime
  // async getErrorValues() {
  //   const res = await lastValueFrom(this.errorService.getErrorValues({}))
  //   Logger.info('getErrorValues', res)
  //   return res
  // }

  @MeasureAsyncTime
  async getErrorId(id: number) {
    const res = await lastValueFrom(this.errorService.getErrorInfo({ id } as GetErrorInfoRequest))
    Logger.info('getErrorId', res)
    return res
  }

  // @MeasureAsyncTime
  // async getErrorOverview() {
  //   const res = await lastValueFrom(this.errorService.getErrorOverview({} as ErrorOverviewRequest))
  //   Logger.info('getErrorOverview', res)
  //   return res
  // }

  // @MeasureAsyncTime
  // async getErrorStatistics() {
  //   return 'getErrorStatistics'
  // }
}
