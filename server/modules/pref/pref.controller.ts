import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/pref')
export class PrefBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get('fmp')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('FMP图表')
  getFmp(@Query() query: Record<string, unknown>) {
    return this.grpc.prefMethod('getFmpChartList', query);
  }

  @Get('time-consuming')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('耗时列表')
  getTimeConsuming(@Query() query: Record<string, unknown>) {
    return this.grpc.prefMethod('getTimeConsumingList', query);
  }

  @Get('max-time')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('最大耗时')
  getMaxTime(@Query() query: Record<string, unknown>) {
    return this.grpc.prefMethod('getTimeConsumingMaxList', query);
  }
}
