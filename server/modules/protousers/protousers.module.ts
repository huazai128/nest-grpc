import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ReflectionService } from '@grpc/reflection'
import { ProtousersController } from './protousers.controller'
import { join } from 'path'
import { CONFIG } from '@app/config'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERPROTO_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: CONFIG.grpcUrl,
          package: 'userproto',
          protoPath: ['user.proto'],
          loader: {
            includeDirs: [join(__dirname, '../../protos')],
            keepCase: true,
          },
          onLoadPackageDefinition: (pkg, server) => {
            // ReflectionService的作用是向gRPC客户端提供有关gRPC服务的元数据信息。它允许客户端查询和发现可用的gRPC服务，以及服务中的方法、消息类型和其他元数据。ReflectionService提供的元数据信息可以用于自动生成客户端代码、动态调用gRPC服务方法以及进行服务发现和探测等。
            new ReflectionService(pkg).addToServer(server)
          },
          // protoPath: join(__dirname, '../../protos/user.proto'),
        },
      },
    ]),
  ],
  controllers: [ProtousersController],
})
export class ProtousersModule {}
