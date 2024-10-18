import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SiteQuery, SiteRequest, SiteService as SiteServiceT } from '@app/protos/site'
import { lastValueFrom } from 'rxjs'
import { SiteDTO, SitePaginateDTO } from './site.dto'

@Injectable()
export class SiteService implements OnModuleInit {
  public siteService: SiteServiceT

  constructor(@Inject('SITEPROTO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.siteService = this.client.getService<SiteServiceT>('SiteService')
  }

  /**
   * 新增和保存
   * @param {*} { apiRules, ...data}
   * @return {*}
   * @memberof SiteService
   */
  public async saveSite(data: SiteDTO) {
    const res = await lastValueFrom(this.siteService.saveSite(data as SiteRequest))
    return res
  }

  /**
   * 获取所有site
   * @param {SitePaginateDTO} data
   * @return {*}
   * @memberof SiteService
   */
  public async getSiteList(data: SitePaginateDTO) {
    const res = await lastValueFrom(this.siteService.getSiteList(data as SiteQuery))
    return res
  }

  /**
   * 获取所有site
   * @param {SitePaginateDTO} data
   * @return {*}
   * @memberof SiteService
   */
  public async updateSiteId(data: SiteRequest) {
    console.log(data, 'data')
    const res = await lastValueFrom(this.siteService.updateSite(data as SiteRequest))
    return res
  }
}
