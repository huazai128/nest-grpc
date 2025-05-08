import { Module } from '@nestjs/common'
import { ExpansionController } from './expansion.controller'
import { ExpansionService } from './expansion.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { CONFIG } from '@app/config'
import { join } from 'path'
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EXPANSION_PACKAGE', // name 属性的值作为注入标记
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'expansionproto',
          protoPath: ['expansion.proto'],
          //loader api： https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true, // 默认是更改为驼峰式大小写。
          },
        },
      },
    ]),
  ],
  controllers: [ExpansionController],
  providers: [ExpansionService],
  exports: [ExpansionService],
})
export class ExpansionModule {}
