import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/userLog')
export class UserLogBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('用户反馈列表')
  getErrorLogs(@Query() query: Record<string, unknown>) {
    return this.grpc.userLogMethod('getErrorLogs', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('用户反馈图表')
  getErrorList(@Query() query: Record<string, unknown>) {
    return this.grpc.userLogMethod('getErrorList', query);
  }

  @Get(':id')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('用户反馈详情')
  getErrorInfo(@Param('id') id: string, @Query() query: Record<string, unknown>) {
    return this.grpc.userLogMethod('getErrorInfo', { ...query, id: Number(id) });
  }
}
