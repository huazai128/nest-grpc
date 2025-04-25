import { action, makeObservable, observable } from 'mobx'
import { ListStore } from '@src/components/SearchData/List/store'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { Site } from '@src/interfaces/site.interface'
import { createStore } from '@src/components/PageProvider'

// 站点响应数据类型定义
type SiteResponse = ResponsePaginationData<Site>

/**
 * 站点管理Store类
 * 处理站点列表的获取、编辑、创建和删除等操作
 */
export class SiteStore extends ListStore {
  constructor() {
    super()
    makeObservable(this)
  }

  // 控制编辑弹窗的显示状态
  @observable isVisible = false

  // 当前正在编辑的站点信息
  @observable site!: Site | null

  /**
   * 重置数据回调函数
   * 继承自ListStore的抽象方法，在数据重置时调用
   */
  resetDataCb() {}

  /**
   * 请求站点列表数据
   * 实现ListStore的抽象方法
   * @param {object} params - 请求参数
   * @return {Promise<SiteResponse | null>} - 返回站点列表数据或null
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
   * 编辑或创建站点
   * @param {Site} values - 站点信息
   * @return {Promise<string>} - 返回操作状态
   * @memberof SiteStore
   */
  @action
  editSite = async ({ ...values }: Site) => {
    // 构建站点数据，默认状态为1（启用）
    const newSite = { ...values, state: 1 }

    // 根据是否有_id判断是更新还是创建
    const res = this.site?._id
      ? await this.api.site.updateSite(this.site?._id, newSite) // 更新已有站点
      : await this.api.site.createSite({ ...values, state: 1 }) // 创建新站点

    if (res.status == 'success') {
      this.isVisible = false // 关闭弹窗
      this.loadMoreData() // 重新加载列表数据
    } else {
      this.$message.error(res.message) // 显示错误信息
    }
    return res.status
  }

  /**
   * 显示编辑弹窗
   * @param {Site} [site] - 要编辑的站点，不传则为新建
   * @memberof SiteStore
   */
  @action
  showModal = (site?: Site) => {
    this.isVisible = true
    this.site = site || null
  }

  /**
   * 隐藏编辑弹窗
   * @memberof SiteStore
   */
  @action
  hideModal = () => {
    this.isVisible = false
    this.site = null
  }

  /**
   * 删除站点
   * @param {Site['_id']} siteId - 站点ID
   * @memberof SiteStore
   */
  @action
  delteSiteId = async (siteId: Site['_id']) => {
    const { message: msg, status } = await this.api.site.deleteSiteId(siteId)
    if (status === 'success') {
      this.loadMoreData() // 重新加载列表数据
      this.$message.success(msg) // 显示成功消息
    } else {
      this.$message.error(msg) // 显示错误消息
    }
  }
}

// 创建并导出Store实例和Provider组件
export const { useStore, StoreProvider: SiteProvider } = createStore<SiteStore>(new SiteStore())
