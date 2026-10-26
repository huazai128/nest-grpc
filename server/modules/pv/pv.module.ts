import { Module } from '@nestjs/common';
import { PvBffController } from './pv.controller';

@Module({
  controllers: [PvBffController],
})
export class PvBffModule {}
