import { action, makeObservable, observable } from 'mobx'
import { ListStore } from '@src/components/SearchData/List/store'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { Site } from '@src/interfaces/site.interface'

type SiteResponse = ResponsePaginationData<Site>

export class SiteStore extends ListStore {
  constructor() {
    super()
    makeObservable(this)
  }

  // 编辑site信息
  @observable site!: Site | null

  /**
   * 重置数据时触发
   * @memberof SiteStore
   */
  resetDataCb() {}

  /**
   *  抽象方法实现
   * @param {*} params
   * @return {*}  {(Promise<SiteResponse | void>)}
   * @memberof SiteStore
   */
  async requestUrl(params: any): Promise<SiteResponse | null> {
    const res = await this.api.site.getSiteList<SiteResponse>({ ...params })
    if (res.status == 'success') {
      return { ...res.result }
    }
    return null
  }

  /**
   * 删除站点
   * @param {Site['_id']} siteId
   * @memberof SiteStore
   */
  @action
  delteSiteId = async (siteId: Site['_id']) => {
    const { message: msg, status } = await this.api.site.deleteSiteId(siteId)
    if (status === 'success') {
      this.loadMoreData()
      this.$message.success(msg)
    } else {
      this.$message.error(msg)
    }
  }
}
