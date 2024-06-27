import { Module } from '@nestjs/common'
import { AppController } from '@app/app.controller'
import { AppService } from '@app/app.service'
import modules from '@app/modules/index'

@Module({
  imports: [...modules],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
