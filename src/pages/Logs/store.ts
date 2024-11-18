import { ListStore } from '@src/components/SearchData/List/store'
import { chartDate, ChartDateItem } from '@src/utils/chartDate'
import { action, makeObservable, observable, toJS } from 'mobx'
import { globalStore } from '@src/stores'
import { handleSearchKeywords } from '@src/utils/util'
import {
  AggDataItem,
  LogAggregationResponse,
  LogChartSearch,
  LogItem,
  LogResponse,
  LogSearch,
} from '@src/interfaces/log.interface'
import { createStore } from '@src/components/PageProvider'

export class LogStore extends ListStore {
  constructor() {
    super()
    makeObservable(this)
  }

  @observable chartList: Array<ChartDateItem> = []

  @observable menuType = 'default'

  // 弹窗
  @observable open = false

  // 弹窗显示类型
  @observable type?: string

  @observable logInfo?: LogItem

  @observable title?: string

  @observable aggData?: Array<AggDataItem> = []

  @observable isLoaddingAgg = false

  @observable aggPage = {
    page: 1,
    size: 20,
    total: 0,
  }

  resetDataCb() {
    this.chartList = []
  }

  /**
   * 通用参数处理
   * @param {(Omit<LogSearch, 'page' | 'size'>)} { time, ...params }
   * @memberof LogStore
   */
  handleCommonParams = ({ time, ...params }: Omit<LogSearch, 'page' | 'size'>) => {
    if (time?.value) {
      params.startTime = time.value[0].valueOf()
      params.endTime = time.value[1].valueOf()
    }
    params.siteId = globalStore.siteId
    if (params.keywordParmas) {
      const result = handleSearchKeywords(params.keywordParmas)
      if (!result) return
      params.keywordParmas = JSON.stringify(result)
    } else {
      delete params.keywordParmas
    }
    params.keyId = params.keyId || undefined
    return params
  }

  async requestUrl({ time, page, size, cursor, paginateMode, ...params }: LogSearch): Promise<LogResponse | null> {
    const { timeSlot, format } = time?.selectInfo || {}
    const nParams = this.handleCommonParams({ ...params, time })
    if (paginateMode === 'page') {
      if (page === 1) {
        this.getLogsChartData({ ...nParams, timeSlot, format })
      }
      const res = await this.api.log.getLogs<LogResponse>({ ...nParams, page, size })

      if (!Object.is(this.menuType, 'default')) {
        this.aggregationPathOrUrlData()
      }
      if (res.status == 'success') {
        return { ...res.result }
      }
    } else if (paginateMode === 'cursor') {
      if (!cursor) {
        this.getLogsChartData({ ...nParams, timeSlot, format })
      }
      const res = await this.api.log.getLogsByCursor<LogResponse>({
        ...nParams,
        cursor,
        size,
      })

      if (!Object.is(this.menuType, 'default')) {
        this.aggregationPathOrUrlData()
      }
      if (res.status == 'success') {
        return { ...res.result }
      }
    }
    return null
  }

  /**
   * 根据条件获取聚合数据
   * @param {LogChartSearch} params
   * @memberof LogStore
   */
  getLogsChartData = async ({ format, ...params }: LogChartSearch) => {
    const { status, result } = await this.api.log.getLogsChart<Array<any>>(params)
    if (Object.is(status, 'success')) {
      const list = chartDate({
        startTime: params.startTime,
        endTime: params.endTime,
        timeSlot: params.timeSlot,
        format: format,
        data: result || [],
      })
      this.chartList = list
    }
  }

  /**
   * 显示弹窗
   * @param {string} type
   * @param {LogItem} logInfo
   * @param {string} title
   * @memberof LogStore
   */
  @action
  onModalType = async (type: string, logInfo: LogItem, title: string) => {
    if (Object.is(type, 'code') || Object.is(type, 'record') || Object.is(type, 'behavior')) {
      await this.getErrorInfo(logInfo.id)
    } else {
      this.logInfo = logInfo
    }
    this.open = true
    this.type = type
    this.title = title
  }

  /**
   * 用户提交日志查看用户行为
   * @param {string} type
   * @param {LogItem} logInfo
   * @param {string} title
   * @memberof LogStore
   */
  @action
  onModalUserShow = async (type: string, logInfo: LogItem, title: string) => {
    await this.getuserReportInfo(logInfo.id)
    this.open = true
    this.type = type
    this.title = title
  }

  /**
   * 隐藏弹窗
   * @memberof LogStore
   */
  @action
  hideModal = () => {
    this.open = false
    this.type = undefined
    this.logInfo = undefined
    this.title = undefined
  }

  /**
   * 根据ID获取错误详情
   * @param {number} id
   * @memberof LogStore
   */
  getErrorInfo = async (id: number) => {
    const { status, result } = await this.api.errorApi.getErrorIdByInfo(id)
    if (Object.is(status, 'success')) {
      this.logInfo = result as any
    }
  }

  /**
   * 根据ID获取用户提交详情
   * @param {number} id
   * @memberof LogStore
   */
  getuserReportInfo = async (id: number) => {
    const { status, result } = await this.api.userLogApi.getIdByInfo(id)
    if (Object.is(status, 'success')) {
      this.logInfo = result as any
    }
  }

  /**
   * 聚合path或者url 数据, 此处可以颗粒化处理，不必全局。
   * @memberof LogStore
   */
  @action
  aggregationPathOrUrlData = async () => {
    if (this.isLoaddingAgg) return
    this.isLoaddingAgg = true
    const params = this.handleCommonParams(this.formRef?.getFieldsValue())
    const { page, size } = this.aggPage
    const { result, status } = await this.api.log.getAggregationPathOrUrl<LogAggregationResponse>({
      ...params,
      type: this.menuType,
      page,
      size,
    })
    if (Object.is(status, 'success')) {
      this.aggPage = { ...toJS(this.aggPage), total: result.pagination?.total }
      const list = result?.data || []
      this.aggData = list.map((item) => ({ ...item, ratio: ((item.value / this.page.total) * 100).toFixed(2) }))
    }
    this.isLoaddingAgg = false
  }

  /**
   * 改变分页
   * @param {number} page
   * @memberof LogStore
   */
  @action
  onPageChange = (page: number) => {
    this.aggPage = { ...toJS(this.aggPage), page: page }
    this.aggregationPathOrUrlData()
  }

  /**
   * 切换数据类型
   * @param {string} type
   * @memberof LogStore
   */
  @action
  updateType = (type: string) => {
    this.menuType = type
    this.aggPage = {
      page: 1,
      size: 20,
      total: 0,
    }
  }
}
export const { useStore: useLogStore, StoreProvider: LogsProvider } = createStore<LogStore>(new LogStore())
