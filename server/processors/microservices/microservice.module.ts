import { Global, Module } from '@nestjs/common'
import { REDIS_SERVICE } from '@app/constants/redis.constant'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { RedisMicroserviceService } from './redis.microservice.service'
import { CONFIG } from '@app/config'

@Global()
@Module({
  imports: [
    // ClientsModule处理了redis连接，内部还是使用routingMap 存储和处理回调问题。在多进程或者多机器下存在问题。
    ClientsModule.register([
      {
        name: REDIS_SERVICE,
        transport: Transport.REDIS,
        options: CONFIG.redisConf,
      },
    ]),
  ],
  providers: [RedisMicroserviceService],
  exports: [RedisMicroserviceService],
})
export class MicroserviceModule {}
