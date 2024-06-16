import { Controller, Get, Header, Render } from '@nestjs/common'
import { AppService } from '@app/app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('/home')
  @Header('content-type', 'text/html')
  @Render('index')
  renderHome() {
    return { data: { name: '华仔' } }
  }
}
