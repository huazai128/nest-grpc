import { StoreExt } from '@src/utils/reactExt'
import { action, makeObservable, observable, toJS } from 'mobx'
import { Dayjs } from 'dayjs'
import { globalStore } from '@src/stores'

export type TypeValues = 'browser' | 'os' | 'screen'

export interface TerminalItem {
  name: string
  conut: number
}

export interface TerminalMap {
  title: string
  type: TypeValues
  list: Array<TerminalItem>
  isLoading: boolean
  total: number
}

export interface TerminalResponse {
  total: number
  data: Array<TerminalItem>
}
export class TerminalStore extends StoreExt {
  constructor() {
    super()
    makeObservable(this)
  }
  @observable mList: Array<TypeValues> = ['browser', 'os', 'screen']

  @observable termianlMaps = new Map<string, TerminalMap>([
    [
      'browser',
      {
        title: '浏览器类型',
        type: 'browser',
        list: [],
        isLoading: false,
        total: 0,
      },
    ],
    [
      'os',
      {
        title: '操作系统',
        type: 'os',
        list: [],
        isLoading: false,
        total: 0,
      },
    ],
    [
      'screen',
      {
        title: '电脑分辨率',
        type: 'screen',
        list: [],
        isLoading: false,
        total: 0,
      },
    ],
  ])

  /**
   *  根据type 获取不同设备不同类型的聚合数据
   * @param {Array<Dayjs>} date
   * @param {TypeValues} type
   * @memberof TerminalStore
   */
  @action
  getTerminalData = async (date: Array<Dayjs>, type: TypeValues) => {
    const mapData = toJS(this.termianlMaps.get(type)) as TerminalMap
    mapData.isLoading = true
    const { result, status } = await this.api.pvApi.getTerminalDataOneDay<Array<TerminalResponse>>({
      siteId: globalStore.siteId,
      startTime: date[0].valueOf(),
      endTime: date[1].valueOf(),
      type: type,
    })
    mapData.isLoading = false
    if (Object.is(status, 'success')) {
      mapData.list = result[0]?.data || []
      mapData.total = result[0]?.total || 0
    }
    this.termianlMaps.set(type, mapData)
  }
}

export default new TerminalStore()
