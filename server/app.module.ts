import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'

// 配置文件导入
import { CONFIG, SESSION } from '@app/config'

// 功能模块导入
import modules from '@app/modules/index'

// 中间件导入
import { LocalMiddleware } from '@app/middlewares/local.middleware' // 本地化中间件
import { CorsMiddleware } from '@app/middlewares/cors.middleware' // CORS跨域中间件
import { AppMiddleware } from '@app/middlewares/app.middleware' // 应用中间件
import { RouterMiddleware } from '@app/middlewares/router.middleware' // 路由中间件
import { OriginMiddleware } from '@app/middlewares/origin.middleware' // 来源验证中间件

// 处理器导入
import { RedisCoreModule } from '@app/processors/redis/redis.module' // Redis核心模块
import { RedisService } from '@app/processors/redis/redis.service' // Redis服务
import { MicroserviceModule } from '@app/processors/microservices/microservice.module' // 微服务模块
import { WebsocketModule } from '@app/processors/websocket/websocket.module' // WebSocket模块

// 拦截器导入
import { LoggingInterceptor } from '@app/interceptors/logging.interceptor' // 日志拦截器

@Module({
  imports: [
    // 导入Redis核心模块并配置
    RedisCoreModule.forRoot(CONFIG.redis),
    // 导入微服务和WebSocket模块
    MicroserviceModule,
    WebsocketModule,
    // 导入其他功能模块
    ...modules,
  ],
  controllers: [],
  providers: [
    // 全局管道 - 用于请求参数验证
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // 全局拦截器 - 用于日志记录
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  constructor(private readonly redisService: RedisService) {}

  // 配置全局中间件
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorsMiddleware, // 处理跨域请求
        OriginMiddleware, // 验证请求来源
        session({
          // 配置session
          store: new RedisStore({
            client: this.redisService.client, // 使用Redis存储session
          }),
          ...SESSION, // 展开session配置
        }),
        AppMiddleware, // 应用级别中间件
        LocalMiddleware, // 本地化处理
        RouterMiddleware, // 路由处理
      )
      .forRoutes('*') // 应用到所有路由
  }
}
