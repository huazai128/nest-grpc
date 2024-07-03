import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { StoreExt } from '@src/utils/reactExt'
import { FormInstance } from 'antd'
import { action, observable, toJS } from 'mobx'
export { ResponseData } from '@src/interfaces/response.iterface'

export interface IParams {
  page: number
  size: number
}

export abstract class TableStore extends StoreExt {
  // 表单
  @observable formRef?: FormInstance

  // 数据
  @observable list: Array<any> = []

  // 是否全选
  @observable selectAll = false

  // 选择操作的数量
  @observable selectTotal = 0

  // 分页数据
  @observable table: IParams = {
    page: 1,
    size: 20,
  }

  // 是否在加载数据中
  @observable isLoading = false

  // 数据总数
  @observable total = 0

  // 选中的
  @observable selectedKeys: Array<string | number> = []

  // rowKey 配置
  @observable rowKey!: (row: any) => number | string

  @action
  resetData = () => {
    this.selectedKeys = []
    this.isLoading = false
    this.list = []
    this.total = 0
    this.selectTotal = 0
    this.selectAll = false
    this.table = {
      page: 1,
      size: 20,
    }
    this.rowKey = (row) => row.id
    this.formRef?.resetFields()
    this.formRef = undefined
    this.resetDataCb()
  }

  /**
   * 获取数据
   * @memberof TableStore
   */
  @action
  getFetchData = async (isPage?: boolean) => {
    if (this.isLoading) return
    this.isLoading = true
    const form = this.formRef?.getFieldsValue()
    const params = {
      ...this.table,
      ...form,
    } as any
    const res = await this.requestUrl(params)
    if (res) {
      const { data, pagination } = res
      const list = data || []
      this.total = pagination.total || this.total
      this.list = list.map((item) => ({ ...item, key: item.id }))
      if (this.selectAll && this.rowKey && isPage) {
        const keys = list.map(this.rowKey) as Array<string | number>
        this.selectedKeys = [...this.selectedKeys, ...keys]
      } else {
        this.selectedKeys = []
        this.selectTotal = 0
      }
    }
    setTimeout(() => {
      this.isLoading = false
    }, 200)
  }

  /**
   * 更新page
   * @param {number} page
   * @memberof TableStore
   */
  @action
  updatePageData = (page: number) => {
    this.table = { ...toJS(this.table), page }
    this.getFetchData(true)
  }

  /**
   * 是否全选
   * @memberof BatchSelect
   */
  @action
  onSelectAll = (selected: boolean) => {
    this.selectTotal = selected ? this.total : 0
    this.selectedKeys = selected ? this.list.map(this.rowKey) : []
    this.selectAll = selected
  }

  /**
   * 单个选取/取消
   * @param {*} record
   * @param {boolean} selected
   * @memberof TableStore
   */
  @action
  onSelect = (record: Record<string, any>, selected: boolean) => {
    const key = this.rowKey(record)
    const keys = [...toJS(this.selectedKeys)]
    this.selectedKeys = selected ? [...keys, key] : keys.filter((item) => item !== key)
    if (this.selectAll) {
      this.selectTotal = selected ? this.selectTotal + 1 : this.selectTotal - 1
    } else {
      this.selectTotal = this.selectedKeys.length
    }
  }

  /**
   * 用于对外调用的接口
   * @param {*} parmas
   * @memberof SelectStore
   */
  abstract requestUrl(parmas: Record<string, any>): Promise<ResponsePaginationData<any> | null>

  /**
   * 页面挂载重置数据
   * @abstract
   * @memberof ListStore
   */
  abstract resetDataCb(): void
}
