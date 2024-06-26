import { MiddlewareConsumer, Module } from '@nestjs/common'
import { AppController } from '@app/app.controller'
import { AppService } from '@app/app.service'
import modules from '@app/modules/index'
import { LocalMiddleware } from './middlewares/local.middleware'
import { CorsMiddleware } from './middlewares/cors.middleware'
import { AppMiddleware } from './middlewares/app.middleware'

@Module({
  imports: [...modules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware, AppMiddleware, LocalMiddleware).forRoutes('*')
  }
}
