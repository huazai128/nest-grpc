import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { StoreExt } from '@src/utils/reactExt'
import { FormInstance } from 'antd'
import { observable, action } from 'mobx'

export type PageInfo = {
  page: number
  size: number
  total: number
  cursor?: string | number
}

export interface RequestUrlParams extends PageInfo {
  paginateMode: ListStore['paginateMode']
  [key: string]: any
}
export abstract class ListStore extends StoreExt {
  constructor() {
    super()
  }
  private isOnce = true

  @observable page: PageInfo = {
    page: 1,
    size: 20,
    total: 0,
  }

  @observable formRef: FormInstance | undefined = undefined

  @observable isLoading = true

  @observable data: Array<Record<string, any>> = []

  @observable isMore = true

  @observable paginateMode: 'cursor' | 'page' = 'cursor'
  @observable hasMore = true
  @observable private cursorPageDatas: { data: ListStore['data']; hasMore: boolean }[] = []

  @action
  resetData = (resetForm = true) => {
    this.isOnce = true
    this.isLoading = true
    this.data = []
    this.cursorPageDatas = []
    this.hasMore = true
    this.isMore = true
    this.page = {
      page: 1,
      size: 20,
      total: 0,
      cursor: undefined,
    }
    this.resetDataCb()
    if (resetForm) {
      this.formRef?.resetFields()
      this.formRef = undefined
    }
  }

  @action
  loadMoreData = async () => {
    if (this.isLoading && !this.isOnce) return false
    this.isOnce = false
    this.isLoading = true
    const parmas = this.formRef?.getFieldsValue()
    const { cursor, ...page } = this.page
    const mode = this.paginateMode
    const res = await this.requestUrl({ ...parmas, ...page, paginateMode: mode, cursor })
    this.isLoading = false
    if (res && res.data) {
      const { data, pagination } = res
      if (pagination.page >= pagination.totalPages) {
        this.isMore = false
      }
      this.data = data || []
      this.page = {
        ...this.page,
        page: mode === 'cursor' ? this.page.page : pagination.page,
        total: pagination.totalDocs,
        cursor: pagination.nextPage,
      }
      this.hasMore = !!pagination.hasNextPage
      this.cursorPageDatas.push({ data, hasMore: this.hasMore })
    }
    return true
  }

  @action
  onChangePage = (page: number) => {
    this.page.page = page
    this.loadMoreData()
  }

  @action
  onCursorNext = async () => {
    if (this.isLoading) return
    this.page.page += 1
    const data = this.cursorPageDatas[this.page.page - 1]
    if (!data) {
      return this.loadMoreData()
    } else {
      this.isLoading = true
      setTimeout(() => {
        const res = this.cursorPageDatas[this.page.page - 1]
        this.data = res.data
        this.hasMore = res.hasMore
        this.isLoading = false
      }, 100)
      return true
    }
  }

  @action
  onCursorPrev = async () => {
    if (this.isLoading) return
    const page = this.page.page
    this.page.page = Math.max(page - 1, 1)
    this.isLoading = true
    setTimeout(() => {
      const res = this.cursorPageDatas[this.page.page - 1]
      this.data = res.data
      this.hasMore = res.hasMore
      this.isLoading = false
    }, 100)
  }

  /**
   * 请求
   * @abstract
   * @param {Record<string, any>} parmas
   * @return {*}  {(Promise<ResponsePaginationData<any> | null>)}
   * @memberof ListStore
   */
  abstract requestUrl(parmas: Record<string, any>): Promise<ResponsePaginationData<any> | null>

  /**
   * 页面挂载重置数据
   * @abstract
   * @memberof ListStore
   */
  abstract resetDataCb(): void
}
