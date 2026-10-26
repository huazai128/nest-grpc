import { action, makeObservable, observable } from 'mobx'
import { ListStore } from '@src/components/SearchData/List/store'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'

type SiteResponse = ResponsePaginationData<ISiteStore.Site>

export class SiteStore extends ListStore {
  constructor() {
    super()
    makeObservable(this)
  }

  // 是否显示编辑弹窗
  @observable isVisible = false

  // 编辑site信息
  @observable site!: ISiteStore.Site | null

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
   * 站点编辑
   * @param {ISiteStore.SiteDTO} values
   * @memberof SiteStore
   */
  @action
  editSite = async ({ ...values }: ISiteStore.SiteDTO) => {
    const newSite = { ...values, state: 1 }
    const res = this.site?._id
      ? await this.api.site.updateSite(this.site?._id, newSite)
      : await this.api.site.createSite({ ...values, state: 1 })
    if (res.status == 'success') {
      this.isVisible = false
      this.loadMoreData()
    } else {
      this.$message.error(res.message)
    }
    return res.status
  }

  /**
   * 是否显示弹出
   * @memberof SiteStore
   */
  @action
  handleModal = (site?: ISiteStore.Site) => {
    this.isVisible = !this.isVisible
    this.site = site || null
  }

  /**
   * 删除站点
   * @param {ISiteStore.Site['_id']} siteId
   * @memberof SiteStore
   */
  @action
  delteSiteId = async (siteId: ISiteStore.Site['_id']) => {
    const { message: msg, status } = await this.api.site.deleteSiteId(siteId)
    if (status === 'success') {
      this.loadMoreData()
      this.$message.success(msg)
    } else {
      this.$message.error(msg)
    }
  }
}

export default new SiteStore()
