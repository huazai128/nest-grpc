import { CONFIG } from '@app/config'
import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { SiteService } from './site.service'
import { SiteController } from './site.controller'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SITEPROTO_PACKAGE', // name 属性的值作为注入标记
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'siteproto',
          protoPath: ['site.proto'],
          //loader api： https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true, // 默认是更改为驼峰式大小写。
          },
          // protoPath: join(__dirname, '../../protos/auth.proto'),
        },
      },
    ]),
  ],
  controllers: [SiteController],
  providers: [SiteService],
})
export class SiteModule {}
