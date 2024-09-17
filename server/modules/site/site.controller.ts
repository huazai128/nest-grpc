import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { SiteService } from './site.service'
import { ApiGuard } from '@app/guards/api.guard'
import { Responsor } from '@app/decorators/responsor.decorator'
import { SiteRequest, SiteResponse } from '@app/protos/site'

@Controller('api/site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('创建站点')
  createSite(@Body() data: SiteRequest): Promise<any> {
    return this.siteService.saveSite(data)
  }
}
