import { ListStore } from '@src/components/SearchData/List/store'
import { chartDate, ChartDateItem } from '@src/utils/chartDate'
import { action, makeObservable, observable, toJS } from 'mobx'
import { globalStore } from '@src/stores'
import { handleSearchKeywords } from '@src/utils/util'
import {
  AggDataItem,
  IPLocationResponse,
  LogAggregationResponse,
  LogChartSearch,
  LogItem,
  LogResponse,
  LogSearch,
} from '@src/interfaces/log.interface'
import { createStore } from '@src/components/PageProvider'

/**
 * 日志管理Store类
 * 处理日志列表的获取、图表数据、聚合数据等操作
 */
export class LogStore extends ListStore {
  constructor() {
    super()
    makeObservable(this)
  }

  /** 图表数据列表 */
  @observable chartList: Array<ChartDateItem> = []

  /** 菜单类型：default-默认列表，page-页面聚合，api-接口聚合 */
  @observable menuType = 'default'

  /** 弹窗显示状态 */
  @observable open = false

  /** 弹窗显示类型 */
  @observable type?: string

  /** 当前日志详情 */
  @observable logInfo?: LogItem

  /** 弹窗标题 */
  @observable title?: string

  /** 聚合数据 */
  @observable aggData?: Array<AggDataItem> = []

  /** 聚合数据加载状态 */
  @observable isLoaddingAgg = false

  /** IP分析结果 */
  @observable ipAnalysis?: IPLocationResponse

  /** 日志总数 */
  @observable total: number = 0

  /** 聚合数据分页信息 */
  @observable aggPage = {
    page: 1,
    size: 20,
    total: 0,
  }

  /**
   * 重置数据回调函数
   * 继承自ListStore的抽象方法，在数据重置时调用
   */
  resetDataCb() {
    this.chartList = []
  }

  /**
   * 通用参数处理
   * @param {(Omit<LogSearch, 'page' | 'size'>)} { time, ...params }
   * @return {Object|undefined} 处理后的参数对象，如果关键词参数无效则返回undefined
   * @memberof LogStore
   */
  handleCommonParams = ({ time, ...params }: Omit<LogSearch, 'page' | 'size'>) => {
    // 处理时间范围参数
    if (time?.value) {
      params.startTime = time.value[0].valueOf() // 转换开始时间为时间戳
      params.endTime = time.value[1].valueOf() // 转换结束时间为时间戳
    }

    // 添加站点ID
    params.siteId = globalStore.siteId

    // 处理关键词参数
    if (params.keywordParmas) {
      const result = handleSearchKeywords(params.keywordParmas)
      if (!result) return // 如果关键词处理结果无效，直接返回
      params.keywordParmas = JSON.stringify(result) // 将处理后的关键词参数转为JSON字符串
    } else {
      delete params.keywordParmas // 如果没有关键词参数，删除该字段
    }

    // 确保keyId有值或为undefined
    params.keyId = params.keyId || undefined

    return params
  }

  /**
   * 请求日志数据
   * @param {LogSearch} params
   * @returns {Promise<LogResponse | null>}
   * @memberof LogStore
   */
  /**
   * 请求日志数据
   * @param {LogSearch} params 日志查询参数
   * @param {object} params.time 时间范围参数
   * @param {number} params.page 页码（分页模式）
   * @param {number} params.size 每页大小
   * @param {string} params.cursor 游标（游标模式）
   * @param {string} params.paginateMode 分页模式：'page'或'cursor'
   * @returns {Promise<LogResponse | null>} 返回日志响应数据或null
   * @memberof LogStore
   */
  async requestUrl({ time, page, size, cursor, paginateMode, ...params }: LogSearch): Promise<LogResponse | null> {
    // 获取时间选择的附加信息
    const { timeSlot, format } = time?.selectInfo || {}
    // 处理通用参数
    const nParams = this.handleCommonParams({ ...params, time })

    // 分页模式
    if (paginateMode === 'page') {
      // 第一页时获取图表数据
      if (page === 1) {
        this.getLogsChartData({ ...nParams, timeSlot, format } as LogChartSearch)
      }
      // 请求分页日志数据
      const res = await this.api.log.getLogs<LogResponse>({ ...nParams, page, size })

      // 非默认菜单类型时，聚合路径或URL数据
      if (!Object.is(this.menuType, 'default')) {
        this.aggregationPathOrUrlData()
      }
      // 请求成功返回结果
      if (res.status == 'success') {
        return { ...res.result }
      }
    }
    // 游标模式
    else if (paginateMode === 'cursor') {
      // 没有游标时（首次请求）获取图表数据
      if (!cursor) {
        this.getLogsChartData({ ...nParams, timeSlot, format } as LogChartSearch)
      }
      // 请求游标分页日志数据
      const res = await this.api.log.getLogsByCursor<LogResponse>({
        ...nParams,
        cursor,
        size,
      })

      // 非默认菜单类型时，聚合路径或URL数据
      if (!Object.is(this.menuType, 'default')) {
        this.aggregationPathOrUrlData()
      }
      // 请求成功返回结果
      if (res.status == 'success') {
        return { ...res.result }
      }
    }
    // 请求失败或其他情况返回null
    return null
  }

  /**
   * 根据条件获取聚合数据
   * @param {LogChartSearch} params
   * @memberof LogStore
   */
  /**
   * 获取日志图表数据
   * @param {LogChartSearch} params - 查询参数，包含格式和其他参数
   * @returns {Promise<void>}
   * @memberof LogStore
   */
  getLogsChartData = async ({ format, ...params }: LogChartSearch) => {
    // 调用API获取日志图表数据
    const { status, result } = await this.api.log.getLogsChart<Array<any>>(params)

    // 如果请求成功
    if (Object.is(status, 'success')) {
      // 获取结果数据，如果为空则使用空数组
      const data = result || []
      // 计算总数，累加所有记录的count值
      this.total = data.reduce((acc, curr) => acc + Number(curr.count), 0)
      // 处理图表日期数据
      const list = chartDate({
        startTime: params.startTime,
        endTime: params.endTime,
        timeSlot: params.timeSlot,
        format: format,
        data: data,
      })
      // 更新图表列表数据
      this.chartList = list
    }
  }

  /**
   * 显示弹窗
   * @param {string} type 弹窗类型
   * @param {LogItem} logInfo 日志信息
   * @param {string} title 弹窗标题
   * @memberof LogStore
   */
  @action
  onModalType = async (type: string, logInfo: LogItem, title: string) => {
    if (Object.is(type, 'code') || Object.is(type, 'record') || Object.is(type, 'behavior')) {
      await this.getErrorInfo(logInfo.cId)
    } else if (type === 'ip') {
      await this.getIpAnalysis(logInfo.ip)
    } else {
      this.logInfo = logInfo
    }
    this.open = true
    this.type = type
    this.title = title
  }

  /**
   * 用户提交日志查看用户行为
   * @param {string} type 弹窗类型
   * @param {LogItem} logInfo 日志信息
   * @param {string} title 弹窗标题
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
    this.ipAnalysis = undefined
  }

  /**
   * 根据ID获取错误详情
   * @param {number} id 错误ID
   * @memberof LogStore
   */
  getErrorInfo = async (id: number) => {
    // TODO: 需要在API中添加errorApi服务
    const { status, result } = await this.api.error.getErrorIdByInfo(id)
    if (Object.is(status, 'success')) {
      this.logInfo = result as any
    }
  }

  /**
   * 根据ID获取用户提交详情
   * @param {number} id 用户日志ID
   * @memberof LogStore
   */
  getuserReportInfo = async (id: number) => {
    // TODO: 需要在API中添加userLogApi服务
    const { status, result } = await this.api.userLogApi.getIdByInfo(id)
    if (Object.is(status, 'success')) {
      this.logInfo = result as any
    }
  }

  /**
   * 聚合path或者url数据
   * 根据当前菜单类型(page/api)获取对应的聚合数据
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
      // TODO: 需要确认pagination中是否有total字段，或使用totalDocs
      this.aggPage = { ...toJS(this.aggPage), total: result.pagination?.total }
      const list = result?.data || []
      this.aggData = list.map((item) => ({ ...item, ratio: ((item.value / this.page.total) * 100).toFixed(2) }))
    }
    this.isLoaddingAgg = false
  }

  /**
   * 改变聚合数据分页
   * @param {number} page 页码
   * @memberof LogStore
   */
  @action
  onPageChange = (page: number) => {
    this.aggPage = { ...toJS(this.aggPage), page: page }
    this.aggregationPathOrUrlData()
  }

  /**
   * 切换数据类型
   * @param {string} type 数据类型：default-默认列表，page-页面聚合，api-接口聚合
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

  /**
   * 获取IP地址分析信息
   * @param {string} ip IP地址
   * @memberof LogStore
   */
  @action
  getIpAnalysis = async (ip: string) => {
    const { status, result } = await this.api.log.getIpAnalysis<IPLocationResponse>({ ip })
    if (Object.is(status, 'success')) {
      this.ipAnalysis = result as IPLocationResponse
    }
  }
}

/**
 * 创建日志Store的Provider和Hook
 */
export const { useStore: useLogStore, StoreProvider: LogsProvider } = createStore<LogStore>(new LogStore())
