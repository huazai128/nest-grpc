import { Module } from '@nestjs/common'
import { RoutesController } from './routes.controller'

@Module({
  imports: [],
  controllers: [RoutesController],
  providers: [],
})
export class RoutesModule {}
