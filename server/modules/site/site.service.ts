import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SiteRequest, SiteService as SiteServiceT } from '@app/protos/site'
import { lastValueFrom } from 'rxjs'

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
  public async saveSite({ apiRules, ...data}: any) {
    const res = await lastValueFrom(this.siteService.saveSite(data))
    return res
  }
}
