import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiGuard } from '@app/guards/api.guard';
import { Responsor } from '@app/decorators/responsor.decorator';
import { MonitorGrpcService } from '@app/processors/grpc/monitor-grpc.service';

@Controller('/api/pv')
export class PvBffController {
  constructor(private readonly grpc: MonitorGrpcService) {}

  @Get('paths')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('获取PV所有路由')
  getPvPaths(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getPvPaths', query);
  }

  @Get('chart')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('聚合PV/UV数据获取')
  getChart(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getErrorList', query);
  }

  @Get('singleDay')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('聚合单个数据')
  getSingleCount(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getSingleCount', query);
  }

  @Get('terminalDataOneDay')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('聚合单日终端数据')
  getTerminalStatistics(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getTerminalStatistics', query);
  }

  @Get('statisticsPathData')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('统计页面数据')
  getStatisticsPath(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getStatisticsPath', query);
  }

  @Get('getSingleDayPathData')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('统计单天页面数据')
  getStatisticsSingleDayPath(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getStatisticsSingleDayPath', query);
  }

  @Get('getStatisticsEquipment')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.paginate()
  @Responsor.handle('统计设备数据')
  getStatisticsEquipment(@Query() query: Record<string, unknown>) {
    return this.grpc.pvMethod('getStatisticsEquipment', query);
  }
}
