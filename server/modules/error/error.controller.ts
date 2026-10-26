import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/error')
export class ErrorController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取错误日志列表')
  getErrorLogs(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorLogs', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('聚合日志列表')
  getErrorList(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorList', query);
  }

  @Get('overview')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('错误总览')
  getErrorOverview(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorOverview', query);
  }

  @Get('values')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('错误值统计')
  getErrorValues(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorValues', query);
  }

  @Get('errorId')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('按 errorId 查询')
  getErrorByErrorId(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorInfo', query);
  }

  @Get('errorCount')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('错误计数')
  getErrorCount(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorCount', query);
  }

  @Get('errorStatistics')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('错误统计分页')
  getErrorStatistics(@Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorStatisticsPaginate', query);
  }

  @Get(':id')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取错误ID')
  getErrorId(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return this.grpc.errorMethod('getErrorInfo', { ...query, id: Number(id) });
  }
}
