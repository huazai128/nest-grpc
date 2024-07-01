import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTHPROTO_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: '0.0.0.0:50052',
          package: 'authproto',
          protoPath: join(__dirname, '../../protos/auth.proto'),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
