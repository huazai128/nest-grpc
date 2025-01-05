import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { RouterController } from './router.controller'
import { RouterSercive } from './router.service'
import { SiteModule } from '../site/site.module'

@Module({
  imports: [SiteModule],
  controllers: [RouterController],
  providers: [RouterSercive],
})
export class RouterModule {}
