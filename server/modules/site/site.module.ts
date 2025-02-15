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
        name: 'SITEPROTO_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'siteproto',
          protoPath: ['site.proto'],
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
