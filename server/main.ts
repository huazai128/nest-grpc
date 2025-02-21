import { NestExpressApplication } from '@nestjs/platform-express'
import { RedisIoAdapter } from '@app/adapters/redis-io.adapter'
import { APP, CONFIG, COOKIE_KEY, environment } from '@app/config'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { LoggingInterceptor } from '@app/interceptors/logging.interceptor'
import { TransformInterceptor } from '@app/interceptors/transform.interceptor'
import { HttpExceptionFilter } from '@app/filters/error.filter'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '@app/app.module'
import logger from '@app/utils/logger'
import { getServerIp } from '@app/utils/util'
import bodyParser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { Request } from 'express'
import { join } from 'path'
import morgan from 'morgan'
import { get } from 'lodash'
import ejs from 'ejs'

async function bootstrap() {
  // 创建 NestJS 应用实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // 设置静态资源和视图目录
  app.useStaticAssets(join(__dirname, '../../dist/client'))
  app.setBaseViewsDir(join(__dirname, '../../dist/views'))

  // 配置视图引擎
  app.setViewEngine('html')
  app.engine('html', ejs.renderFile)

  // 配置全局中间件
  app.use(compression()) // 启用 gzip 压缩
  app.use(bodyParser.json({ limit: '10mb' })) // 解析 JSON 请求体，限制大小为 10mb
  app.use(cookieParser(COOKIE_KEY)) // 解析 Cookie

  // 自定义 Morgan 日志格式
  // 获取用户ID
  morgan.token('userId', (req: Request) => {
    return get(req, 'cookies.userId') || get(req, 'session.user.userId') || ''
  })

  // 记录请求参数
  morgan.token('requestParameters', (req: Request) => {
    return Object.keys(req.query).length ? JSON.stringify(req.query) : '-'
  })

  // 记录请求体
  morgan.token('requestBody', (req: Request) => {
    return Object.keys(req.body).length ? JSON.stringify(req.body) : '-'
  })

  // 配置请求日志中间件
  app.use(
    morgan(
      ':remote-addr - [:userId] - :remote-user ":method :url HTTP/:http-version" ":referrer" ":user-agent" :status :res[content-length] :requestParameters :requestBody --- :response-time ms',
    ),
  )

  // 全局异常过滤器和拦截器
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor())

  // 配置 WebSocket 适配器
  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis()
  app.useWebSocketAdapter(redisIoAdapter)

  // 配置 Redis 微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: CONFIG.redisConf,
  })

  // 启动所有微服务和主应用
  await app.startAllMicroservices()
  await app.listen(APP.PORT).then(() => {
    const url = `http://${getServerIp()}:${APP.PORT}`
    logger.info(`Application is running on: ${url}, env: ${environment}`)
  })
}

bootstrap()
