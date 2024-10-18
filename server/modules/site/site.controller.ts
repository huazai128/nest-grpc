import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common'
import { SiteService } from './site.service'
import { ApiGuard } from '@app/guards/api.guard'
import { Responsor } from '@app/decorators/responsor.decorator'
import { SiteRequest, SiteResponse } from '@app/protos/site'
import { SitePaginateDTO, SiteDTO } from './site.dto'
import { QueryParams, QueryParamsResult } from '@app/decorators/params.decorator'

@Controller('api/site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  /**
   * 新增site
   * @param {SiteDTO} data
   * @return {*}  {Promise<SiteResponse>}
   * @memberof SiteController
   */
  @Post()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('创建站点')
  createSite(@Body() data: SiteDTO): Promise<SiteResponse> {
    return this.siteService.saveSite(data)
  }

  /**
   * 分页获取site 站点数据
   * @param {SitePaginateDTO} query
   * @return {*}
   * @memberof SiteController
   */
  @Get()
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('创建站点')
  async getSiteList(@Query() query: SitePaginateDTO) {
    return this.siteService.getSiteList(query)
  }

  /**
   * 更新站点
   * @param {QueryParamsResult} { params }
   * @param {Site} site
   * @return {*}
   * @memberof SiteController
   */
  @Put(':id')
  @UseGuards(ApiGuard)
  @Responsor.api()
  @Responsor.handle('更新站点')
  putSite(@QueryParams() { params }: QueryParamsResult, @Body() site: SiteDTO) {
    return this.siteService.updateSiteId({ ...site, id: Number(params.id) } as SiteRequest)
  }
}
