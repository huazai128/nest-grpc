import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { QueryDTO } from '@app/protos/common/query_dto';
import { NetworkSpeedLogService as NetworkSpeedLogServiceT } from '@app/protos/network_speed';
import { lastValueFrom } from 'rxjs';
import { ChartItem } from '@app/protos/common/chart_item';

@Injectable()
export class NetworkSpeedLogService implements OnModuleInit {
  private client: NetworkSpeedLogServiceT;

  constructor(@Inject('NETWORK_SPEED_PACKAGE') private grpc: ClientGrpc) {}

  onModuleInit() {
    this.client = this.grpc.getService<NetworkSpeedLogServiceT>(
      'NetworkSpeedLogService',
    );
  }

  getList(query: QueryDTO) {
    return lastValueFrom(this.client.getList(query));
  }

  async getChart(query: QueryDTO): Promise<ChartItem[]> {
    const res = await lastValueFrom(this.client.getChart(query));
    return res.data ?? [];
  }
}
