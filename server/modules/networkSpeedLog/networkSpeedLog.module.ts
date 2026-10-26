import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CONFIG } from '@app/config';
import { join } from 'path';
import { NetworkSpeedLogController } from './networkSpeedLog.controller';
import { NetworkSpeedLogService } from './networkSpeedLog.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NETWORK_SPEED_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'networkspeedproto',
          protoPath: ['network_speed.proto'],
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true,
          },
        },
      },
    ]),
  ],
  controllers: [NetworkSpeedLogController],
  providers: [NetworkSpeedLogService],
})
export class NetworkSpeedLogModule {}
