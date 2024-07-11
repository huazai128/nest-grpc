import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common'
import modules from '@app/modules/index'
import { LocalMiddleware } from '@app/middlewares/local.middleware'
import { CorsMiddleware } from '@app/middlewares/cors.middleware'
import { AppMiddleware } from '@app/middlewares/app.middleware'
import { RedisCoreModule } from '@app/processors/redis/redis.module'
import { RedisService } from '@app/processors/redis/redis.service'
import session from 'express-session'
import { CONFIG, SESSION } from './config'
import RedisStore from 'connect-redis'
import { APP_PIPE } from '@nestjs/core'
import { MicroserviceModule } from '@app/processors/microservices/microservice.module'

@Module({
  imports: [RedisCoreModule.forRoot(CONFIG.redis), MicroserviceModule, ...modules],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {
  constructor(private readonly redisService: RedisService) {}
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorsMiddleware,
        session({
          store: new RedisStore({
            client: this.redisService.client,
          }),
          ...SESSION,
        }),
        AppMiddleware,
        LocalMiddleware,
      )
      .forRoutes('*')
  }
}
