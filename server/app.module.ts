import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common'
import modules from '@app/modules/index'
import { LocalMiddleware } from './middlewares/local.middleware'
import { CorsMiddleware } from './middlewares/cors.middleware'
import { AppMiddleware } from './middlewares/app.middleware'
import { RedisCoreModule } from './processors/redis/redis.module'
import { RedisService } from './processors/redis/redis.service'
import session from 'express-session'
import { SESSION } from './config'
import RedisStore from 'connect-redis'
import { APP_PIPE } from '@nestjs/core'

@Module({
  imports: [
    RedisCoreModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    ...modules,
  ],
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
