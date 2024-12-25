import { Module } from '@nestjs/common'
import { InterceptController } from './intercept.controller'

@Module({
  controllers: [InterceptController],
})
export class InterceptModule {}
