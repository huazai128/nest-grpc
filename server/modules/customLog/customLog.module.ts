import { Module } from '@nestjs/common';
import { CustomLogBffController } from './customLog.controller';

@Module({ controllers: [CustomLogBffController] })
export class CustomLogBffModule {}
