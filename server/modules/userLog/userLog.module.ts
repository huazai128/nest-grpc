import { Module } from '@nestjs/common';
import { UserLogBffController } from './userLog.controller';

@Module({ controllers: [UserLogBffController] })
export class UserLogBffModule {}
