import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { APP_PIPE } from '@nestjs/core'

// config
import { CONFIG, SESSION } from './config'

// modules
import modules from '@app/modules/index'

// middlewares
import { LocalMiddleware } from '@app/middlewares/local.middleware'
import { CorsMiddleware } from '@app/middlewares/cors.middleware'
import { AppMiddleware } from '@app/middlewares/app.middleware'
import { RouterMiddleware } from '@app/middlewares/router.middleware'

// processors
import { RedisCoreModule } from '@app/processors/redis/redis.module'
import { RedisService } from '@app/processors/redis/redis.service'
import { MicroserviceModule } from '@app/processors/microservices/microservice.module'
import { WebsocketModule } from '@app/processors/websocket/websocket.module'

@Module({
  imports: [RedisCoreModule.forRoot(CONFIG.redis), MicroserviceModule, WebsocketModule, ...modules],
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
        RouterMiddleware,
      )
      .forRoutes('*')
  }
}
