import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CONFIG } from '@app/config';
import { join } from 'path';
import { MonitorGrpcService } from './monitor-grpc.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MONITOR_GRPC',
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: ['monitorproto', 'errorproto'],
          protoPath: ['monitor_services.proto', 'error.proto'],
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true,
          },
        },
      },
    ]),
  ],
  providers: [MonitorGrpcService],
  exports: [MonitorGrpcService],
})
export class MonitorGrpcModule {}
