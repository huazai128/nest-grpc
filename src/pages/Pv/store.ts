import { StoreExt } from '@src/utils/reactExt'
import { action, makeObservable, observable } from 'mobx'
import { globalStore } from '@src/stores'
import { FormInstance } from 'antd'
import { ChangeItem, DateSingle, calculateChanges, chartDate } from '@src/utils/chartDate'
import dayjs, { Dayjs } from 'dayjs'
import { SingleItem } from '@src/interfaces/chart.interface'

export interface PvChartItem {
  pv: number
  uv: number
  startTime: string
}

export interface CompareChartItem {
  value: number
  startTime: string
  type: string
}

export type PvStatistics = DateSingle<SingleItem>

export class PvStore extends StoreExt {
  constructor() {
    super()
    makeObservable(this)
  }

  @observable form: FormInstance | undefined = undefined

  // 单日统计数据
  @observable signData: Array<ChangeItem> = []

  // pv/uv统计数据
  @observable chartList: Array<PvChartItem> = []

  // 访问实时数据
  @observable compareList: Array<CompareChartItem> = []

  @observable singleLoading = false

  /**
   * 更新form
   * @param {FormInstance} form
   * @memberof PvStore
   */
  @action
  updateForm = (form: FormInstance) => {
    this.form = form
  }

  /**
   * 获取单天数据
   * @memberof PvStore
   */
  @action
  getSingleDay = async (date: Array<Dayjs>) => {
    if (this.singleLoading) return false
    this.singleLoading = true
    const { result, status } = await this.api.pvApi.getSingleDay<PvStatistics>({
      siteId: globalStore.siteId,
      startTime: date[0].valueOf(),
      endTime: date[1].valueOf(),
    })
    if (Object.is(status, 'success')) {
      this.signData = calculateChanges<SingleItem>(result, ['totalUv', 'totalPv'])
    }
    this.singleLoading = false
  }

  /**
   * 获取pv、uv统计数据
   * @memberof PvStore
   */
  @action
  getPvDataChart = async () => {
    const { time, ...params } = this.form?.getFieldsValue()
    const { timeSlot, format } = time?.selectInfo || {}
    let nTimeSlot = timeSlot
    if (time.value) {
      params.startTime = time.value[0].valueOf()
      params.endTime = time.value[1].valueOf()
      const diffDay = time.value[1].diff(time.value[0], 'day')
      if (diffDay >= 7) {
        nTimeSlot = 24 * 60 * 60 * 1000
      }
    }
    const { status, result } = await this.api.pvApi.getPvDataChart<Array<PvChartItem>>({
      siteId: globalStore.siteId,
      timeSlot: nTimeSlot,
      ...params,
    })
    if (Object.is(status, 'success')) {
      const list = chartDate({
        startTime: params.startTime,
        endTime: params.endTime,
        timeSlot: nTimeSlot,
        format: format,
        data: result || [],
        splitKeys: ['pv', 'uv'],
      })
      console.log(list, 'list====')
      this.chartList = list
    } else {
      this.chartList = []
    }
  }
}

export default new PvStore()
