import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/request')
export class ApiLogBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取接口列表')
  getReuqestUrls(@Query() query: Record<string, unknown>) {
    return this.grpc.apiMethod('getReuqestUrls', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('聚合获取API信息')
  getChart(@Query() query: Record<string, unknown>) {
    return this.grpc.apiMethod('getReuqestUrls', query);
  }
}
