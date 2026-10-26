import { Module } from '@nestjs/common';
import { EventLogBffController } from './eventLog.controller';

@Module({ controllers: [EventLogBffController] })
export class EventLogBffModule {}
