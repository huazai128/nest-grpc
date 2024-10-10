import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { SiteService } from './site.service'
import { ApiGuard } from '@app/guards/api.guard'
import { Responsor } from '@app/decorators/responsor.decorator'
import { SiteResponse } from '@app/protos/site'
import { SitoDTO } from './site.dto'

@Controller('api/site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Post()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('创建站点')
  createSite(@Body() data: SitoDTO): Promise<SiteResponse> {
    return this.siteService.saveSite(data)
  }

  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('创建站点')
  getSiteList() { 

  }
}
