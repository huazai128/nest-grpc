import { Module } from '@nestjs/common';
import { ApiLogBffController } from './apiLog.controller';

@Module({ controllers: [ApiLogBffController] })
export class ApiLogBffModule {}
