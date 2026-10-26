import { TableStore } from '@src/components/RcTable'
import { chartDate, ChartDateItem } from '@src/utils/chartDate'
import { globalStore } from '@src/stores'
import { makeObservable, observable } from 'mobx'

export class NetworkSpeedStore extends TableStore {
  constructor() {
    super()
    makeObservable(this)
  }

  @observable chartList: ChartDateItem[] = []

  resetDataCb = () => {
    this.chartList = []
  }

  async requestUrl({
    time,
    page,
    size,
    ...params
  }: INetworkSpeedStore.NetworkSpeedSearch): Promise<INetworkSpeedStore.NetworkSpeedResponse | null> {
    const { timeSlot, format } = time?.selectInfo || {}
    if (time?.value) {
      params.startTime = time.value[0].valueOf()
      params.endTime = time.value[1].valueOf()
    }
    params.siteId = globalStore.siteId
    params.keyId = params.keyId || undefined

    if (page === 1 && params.startTime && params.endTime && timeSlot && format) {
      void this.getChart({ ...params, timeSlot, format })
    }

    const response = await this.api.networkSpeedApi.getList<INetworkSpeedStore.NetworkSpeedResponse>({
      ...params,
      page,
      size,
    })
    return response.status === 'success' ? response.result : null
  }

  private getChart = async ({ format, ...params }: INetworkSpeedStore.NetworkSpeedChartSearch) => {
    const response = await this.api.networkSpeedApi.getChart<INetworkSpeedStore.NetworkSpeedChartItem[]>(params)
    if (response.status !== 'success') return
    this.chartList = chartDate({
      startTime: params.startTime,
      endTime: params.endTime,
      timeSlot: params.timeSlot,
      format,
      data: response.result || [],
    })
  }
}

export default new NetworkSpeedStore()
