import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SiteRequest, SiteService as SiteServiceT } from '@app/protos/site'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class SiteService implements OnModuleInit {
  public siteService: SiteServiceT

  constructor(@Inject('AUTHPROTO_PACKAGE') private readonly client: ClientGrpc) {}
  onModuleInit() {
    this.siteService = this.client.getService<SiteServiceT>('SiteService')
  }

  async saveSite(data: SiteRequest) {
    const res = await lastValueFrom(this.siteService.createSite(data))
    console.log(res, 'res======')
    return res
  }
}
