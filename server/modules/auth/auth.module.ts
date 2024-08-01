import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PassportModule } from '@nestjs/passport'
import { AUTH, CONFIG } from '@app/config'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTHPROTO_PACKAGE', // name 属性的值作为注入标记
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'authproto',
          protoPath: ['auth.proto'],
          //loader api： https://github.com/grpc/grpc-node/blob/master/packages/proto-loader/README.md
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true, // 默认是更改为驼峰式大小写。
          },
          // protoPath: join(__dirname, '../../protos/auth.proto'),
        },
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: AUTH.jwtTokenSecret,
      signOptions: {
        expiresIn: AUTH.expiresIn as number,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
