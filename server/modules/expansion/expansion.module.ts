import { Module } from '@nestjs/common'
import { ExpansionController } from './expansion.controller'
import { ExpansionService } from './expansion.service'
@Module({
  controllers: [ExpansionController],
  providers: [ExpansionService],
  exports: [ExpansionService],
})
export class ExpansionModule {}
