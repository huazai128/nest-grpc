import { action, makeObservable, observable } from 'mobx'
import dayjs, { Dayjs } from 'dayjs'
import { DateInfo, dateList, selfDataList } from './data'
import type { MenuProps } from 'antd'
import { createStore } from '../PageProvider'

export interface DateSelectProps {
  value: Array<Dayjs>
  selectInfo?: DateInfo
}

export class DateStore {
  constructor() {
    makeObservable(this)
    this.initData()
  }

  private isOpenPicker = false

  /**
   * 选择的keys
   * @memberof DateStore
   */
  @observable selectedKeys = ['1']

  /**
   * hover的time
   * @type {Array<Dayjs>}
   * @memberof DateStore
   */
  @observable times: Array<Dayjs> = []

  /**
   * 选择时间ID
   * @memberof DateStore
   */
  @observable selectId?: number

  /**
   * 选择的信息
   * @type {DateInfo}
   * @memberof DateStore
   */
  @observable selectInfo?: Partial<DateInfo>

  /**
   * 选择的时间
   * @memberof DateStore
   */
  @observable selectTime: Array<Dayjs> = []

  /**
   * 控制下拉框
   * @type {boolean}
   * @memberof DateStore
   */
  @observable open = false

  /**
   * 监听鼠标进入
   * @param {DateInfo} dateItem
   * @memberof DateStore
   */
  @action
  onMouseEnter = (dateItem: DateInfo) => {
    this.handleTime(dateItem)
  }

  /**
   * 切换tabs
   * @param {*} { selectedKeys }
   * @type {MenuProps['onSelect']}
   * @memberof DateStore
   */
  @action
  onChangeMenu: MenuProps['onSelect'] = ({ selectedKeys }) => {
    this.selectedKeys = selectedKeys
  }

  /**
   * 选择时间
   * @param {DateInfo} dateItem
   * @memberof DateStore
   */
  @action
  onSelectTime = (dateItem: DateInfo) => {
    this.selectId = dateItem.id
    this.selectInfo = dateItem
    this.handleTime(dateItem)
    this.selectTime = this.times
    this.open = false
  }

  /**
   * 开启
   * @memberof DateStore
   */
  @action
  onOpenChange = () => {
    if (!this.isOpenPicker) {
      this.open = !this.open
    }
  }

  /**
   * 自定义选择日期
   * @param {Array<Dayjs>} time
   * @memberof DateStore
   */
  @action
  customTime = (time: Array<Dayjs>) => {
    const diffTime = time[1].diff(time[0], 'day')
    const diffHour = time[1].diff(time[0], 'hour')
    if (diffHour <= 48) {
      if (diffHour < 4) {
        this.selectInfo = selfDataList[4]
      } else if (diffHour < 12) {
        this.selectInfo = selfDataList[5]
      } else {
        this.selectInfo = selfDataList[6]
      }
    } else {
      if (diffTime < 3) {
        this.selectInfo = selfDataList[0]
      } else if (diffTime >= 3 && diffTime < 30) {
        this.selectInfo = selfDataList[1]
      } else if (diffTime >= 30 && diffTime < 90) {
        this.selectInfo = selfDataList[2]
      } else {
        this.selectInfo = selfDataList[3]
      }
    }
    this.selectId = undefined
    this.selectTime = time
    this.open = false
  }

  /**
   * 初始化数据
   * @memberof DateStore
   */
  @action
  initData = () => {
    const date = dateList[0]
    this.selectInfo = date
    this.selectId = date.id
    this.handleTime(date)
    this.selectTime = this.times
  }

  /**
   * 处理时间
   * @param {DateInfo} { type, value }
   * @memberof DateStore
   */
  handleTime = ({ type, value }: DateInfo) => {
    let startTime: Dayjs
    switch (type) {
      case 'minute':
      case 'hour':
      case 'day':
      case 'week':
      case 'month':
      case 'year':
        startTime = dayjs().subtract(value, type)
        break
      case 'today':
        startTime = dayjs().startOf('date')
        break
      case 'thisWeek':
        startTime = dayjs().startOf('week')
        break
      case 'thisMonth':
        startTime = dayjs().startOf('month')
        break
      case 'thisYear':
        startTime = dayjs().startOf('year')
        break
      default:
        startTime = dayjs().startOf(type)
        break
    }
    this.times = [startTime, dayjs()]
  }

  /**
   * 时间选择
   * @param {boolean} open
   * @memberof DateStore
   */
  @action
  onOpenPickerChange = (open: boolean) => {
    this.isOpenPicker = open
  }
}

export const { useStore: useDateStore, StoreProvider: DateSelectProvider } = createStore<DateStore>(new DateStore())
