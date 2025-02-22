import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc, RpcException } from '@nestjs/microservices'
import { SiteQuery, SiteRequest, SiteService as SiteServiceT } from '@app/protos/site'
import { lastValueFrom } from 'rxjs'
import { SiteDTO, SitePaginateDTO } from './site.dto'
import { createLogger } from '@app/utils/logger'
import { measureAsyncTime } from '@app/decorators/async.decorator'

const Logger = createLogger({ scope: 'LogService', time: true })

/**
 * 站点服务
 * @class SiteService
 * @implements {OnModuleInit}
 */
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
  @measureAsyncTime
  public async saveSite(data: SiteDTO) {
    try {
      const res = await lastValueFrom(this.siteService.saveSite(data as SiteRequest))
      return res
    } catch (error) {
      Logger.error('saveSite grpc错误信息:', error.code, error.message)
      throw new RpcException({ code: error.code })
    }
  }

  /**
   * 获取所有site
   * @param {SitePaginateDTO} data
   * @return {*}
   * @memberof SiteService
   */
  @measureAsyncTime
  public async getSiteList(data: SitePaginateDTO) {
    // 确认好id 长度，建议对id 处理成Long 类型，不然随着id 自增后数据，导致传递bug
    const res = await lastValueFrom(this.siteService.getSiteList(data as SiteQuery))
    return res
  }

  /**
   * 获取所有site
   * @param {SitePaginateDTO} data
   * @return {*}
   * @memberof SiteService
   */
  @measureAsyncTime
  public async updateSiteId(data: SiteRequest) {
    const res = await lastValueFrom(this.siteService.updateSite(data as SiteRequest))
    return res
  }

  /**
   * 根据ID删除
   * @param {number} id
   * @return {*}
   * @memberof SiteService
   */
  @measureAsyncTime
  public async deleteSiteId(id: string) {
    const res = await lastValueFrom(this.siteService.deleteSiteId({ id: id }))
    return res
  }

  /**
   * 通过自增id获取站点信息
   * @param {string} id
   * @memberof SiteService
   */
  @measureAsyncTime
  public async getByIdSiteInfo(id: string) {
    const res = await lastValueFrom(this.siteService.getByIdSiteInfo({ id: id }))
    return res
  }
}
