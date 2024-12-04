import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { LogService } from './log.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CONFIG } from '@app/config'
import { join } from 'path'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTHPROTO_PACKAGE', // name 属性的值作为注入标记
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'logproto',
          protoPath: ['log.proto'],
          //loader api： https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true, // 默认是更改为驼峰式大小写。
          },
        },
      },
    ]),
  ],
  controllers: [LogController],
  providers: [LogService],
})
export class LogModule {}
