import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { ProtousersController } from './protousers.controller'
import { ReflectionService } from '@grpc/reflection'
import { loadPackageDefinition } from '@grpc/grpc-js'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERPROTO_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: '0.0.0.0:50052',
          package: 'userproto',
          protoPath: join(__dirname, './user.proto'),
        },
      },
    ]),
  ],
  controllers: [ProtousersController],
})
export class ProtousersModule {}
