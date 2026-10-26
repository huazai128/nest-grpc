import { action, makeObservable, observable, toJS } from 'mobx'
import dayjs from 'dayjs'
import { ChartDateItem, chartDate } from '@src/utils/chartDate'
import { globalStore } from '@src/stores'
import { TableStore } from '@src/components/RcTable'

export class UserLogStore extends TableStore {
  constructor() {
    super()
    makeObservable(this)
  }

  @observable chartList: Array<ChartDateItem> = []

  @observable isVisible = false

  @observable errorList: Array<Record<string, any>> = []
  // 弹窗
  @observable open = false

  // 弹窗显示类型
  @observable type?: string

  @observable logInfo?: ILogStore.LogItem

  @observable title?: string

  resetDataCb = () => {
    this.chartList = []
  }

  async requestUrl({
    time,
    page,
    size,
    ...params
  }: IUserLogStore.UserLogSearch): Promise<IUserLogStore.UserLogResponse | null> {
    const { timeSlot, format } = time?.selectInfo || {}
    if (time?.value) {
      params.startTime = time.value[0].valueOf()
      params.endTime = time.value[1].valueOf()
    }
    dayjs(params.startTime).format('YYYY-MM-DD HH:mm:ss')
    params.siteId = globalStore.siteId
    if (!params.kw) {
      delete params.kw
    }
    params.keyId = params.keyId || undefined
    if (page === 1) {
      this.getUserLogsChartData({ ...params, timeSlot, format })
    }

    const res = await this.api.userLogApi.getuserLogList<IUserLogStore.UserLogResponse>({ ...params, page, size })
    if (res.status == 'success') {
      return { ...res.result }
    }
    return null
  }

  getUserLogsChartData = async ({ format, ...params }: IUserLogStore.UserLogChartSearch) => {
    const { status, result } = await this.api.userLogApi.getuserLogChartList<Array<any>>(params)
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

  @action
  showModal = async (id: number) => {
    const { result } = await this.api.userLogApi.getIdByInfo<IUserLogStore.UserLogItem>(id)
    this.isVisible = true
    if (result) {
      this.errorList = result.errorList || []
    }
  }

  @action
  hideErrorModal = () => {
    this.isVisible = false
    this.errorList = []
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
   * 显示弹窗
   * @param {string} type
   * @param {*} logInfo
   * @param {string} title
   * @memberof UserLogStore
   */
  @action
  onModalType = async (type: string, logInfo: any, title: string) => {
    if (!logInfo?.isRequest) {
      const { result } = await this.api.errorApi.getErrorUUidbyInfo<IUserLogStore.UserLogItem>(logInfo?.errorUUid)
      const newError = { ...logInfo, isRequest: true, ...(result || {}) }
      this.errorList = [...toJS(this.errorList)].map((item) =>
        item.errorUUid === logInfo?.errorUUid ? newError : item,
      )
      this.logInfo = newError
    } else {
      this.logInfo = logInfo
    }
    // this.logInfo = logInfo
    this.open = true
    this.type = type
    this.title = title
  }
}

export default new UserLogStore()
