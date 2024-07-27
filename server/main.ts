import { NestExpressApplication } from '@nestjs/platform-express'
import { RedisIoAdapter } from '@app/adapters/redis-io.adapter'
import { APP, CONFIG, COOKIE_KEY, environment } from '@app/config'
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
import { MicroserviceOptions, Transport } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.useStaticAssets(join(__dirname, '../../dist/client'))
  app.setBaseViewsDir(join(__dirname, '../../dist/views'))

  app.setViewEngine('html')
  app.engine('html', ejs.renderFile)

  app.use(compression())
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(cookieParser(COOKIE_KEY))

  // 查看userid
  morgan.token('userId', (req: Request) => {
    return get(req, 'cookies.userId') || get(req, 'session.user.userId') || ''
  })

  // 显示请求query
  morgan.token('requestParameters', (req: Request) => {
    return !!Object.keys(req.query).length ? JSON.stringify(req.query) : '-'
  })

  // 显示请求body
  morgan.token('requestBody', (req: Request) => {
    return !!Object.keys(req.body).length ? JSON.stringify(req.body) : '-'
  })

  // 请求头信息
  app.use(
    morgan(
      ':remote-addr - [:userId] - :remote-user ":method :url HTTP/:http-version" ":referrer" ":user-agent" :status :res[content-length] :requestParameters :requestBody --- :response-time ms',
    ),
  )

  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis()

  app.useWebSocketAdapter(redisIoAdapter)

  // redis 微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: CONFIG.redisConf,
  })
  await app.startAllMicroservices()
  await app.listen(APP.PORT).then(() => {
    logger.info(`Application is running on: http://${getServerIp()}:${APP.PORT}, env: ${environment}}`)
  })
}
bootstrap()
