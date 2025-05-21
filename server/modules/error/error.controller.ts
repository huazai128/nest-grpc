import { Controller, Get, UseGuards, Param } from '@nestjs/common'
import { ErrorService } from './error.service'
import { ApiGuard } from '@app/guards/api.guard'
import { Responsor } from '@app/decorators/responsor.decorator'
import { createLogger } from '@app/utils/logger'
const Logger = createLogger({ scope: 'ErrorController', time: true })
/**
 * 错误控制器
 * @class ErrorController
 */
@Controller('/api/error')
export class ErrorController {
  constructor(private readonly errorService: ErrorService) {}

  // @Get('logs')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误日志')
  // @Responsor.handle('获取错误日志列表')
  // getErrorLogs(@Query() query: ErrorPaginateDTO) {
  //   return this.errorService.getErrorLogs(query)
  // }

  // @Get('chart')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误图表')
  // async getErrorChart() {
  //   return this.errorService.getErrorChart()
  // }

  // @Get('overview')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误概览')
  // async getErrorOverviewData() {
  //   return this.errorService.getErrorOverviewList()
  // }

  // @Get('values')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误值')
  // async getErrorValues() {
  //   return this.errorService.getErrorValues()
  // }

  @Get('/:errorId')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取错误ID')
  async getErrorId(@Param('errorId') errorId: number) {
    Logger.info('getErrorId', errorId)
    return this.errorService.getErrorId(errorId)
  }

  // @Get('errorOverview')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误概览')
  // async getErrorOverview() {
  //   return this.errorService.getErrorOverview()
  // }

  // @Get('errorStatistics')
  // @UseGuards(ApiGuard)
  // @Responsor.api()
  // @Responsor.handle('获取错误统计')
  // async getErrorStatistics() {
  //   return this.errorService.getErrorStatistics()
  // }
}
