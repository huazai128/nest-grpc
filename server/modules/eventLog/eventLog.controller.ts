import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/event')
export class EventLogBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('事件日志列表')
  getEventLogs(@Query() query: Record<string, unknown>) {
    return this.grpc.eventMethod('getEventLogs', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('事件图表')
  getEventChart(@Query() query: Record<string, unknown>) {
    return this.grpc.eventMethod('getEventChartLogs', query);
  }

  @Get('type')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('事件类型分组')
  getEventType(@Query() query: Record<string, unknown>) {
    return this.grpc.eventMethod('getCustomGroupChartLogs', query);
  }
}
