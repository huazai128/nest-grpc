import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/custom')
export class CustomLogBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('自定义日志列表')
  getCustomLogs(@Query() query: Record<string, unknown>) {
    return this.grpc.customMethod('getCustomLogs', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('自定义图表')
  getCustomChart(@Query() query: Record<string, unknown>) {
    return this.grpc.customMethod('getCustomChartLogs', query);
  }

  @Get('type')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('自定义类型分组')
  getCustomType(@Query() query: Record<string, unknown>) {
    return this.grpc.customMethod('getCustomGroupChartLogs', query);
  }
}
