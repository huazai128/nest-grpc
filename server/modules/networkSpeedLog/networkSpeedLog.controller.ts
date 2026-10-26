import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { NetworkSpeedLogService } from './networkSpeedLog.service';
import { QueryDTO } from '@app/protos/common/query_dto';

@Controller('/api/network-speed-log')
export class NetworkSpeedLogController {
  constructor(private readonly networkSpeedLogService: NetworkSpeedLogService) {}

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取网络测速日志列表')
  getList(@Query() query: QueryDTO) {
    return this.networkSpeedLogService.getList(query);
  }

  @Get('/chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('获取网络测速上报次数')
  getChart(@Query() query: QueryDTO) {
    return this.networkSpeedLogService.getChart(query);
  }
}
