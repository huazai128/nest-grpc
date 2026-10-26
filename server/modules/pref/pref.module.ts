import { Module } from '@nestjs/common';
import { PrefBffController } from './pref.controller';

@Module({ controllers: [PrefBffController] })
export class PrefBffModule {}
