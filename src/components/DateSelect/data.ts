import { DateInfo } from '@src/interfaces/search.interface'
export type { DateInfo } from '@src/interfaces/search.interface'
import { MenuProps } from 'antd'

export const items: MenuProps['items'] = [
  {
    label: '相对',
    key: '1',
  },
  {
    label: '自定义',
    key: '2',
  },
]

export const dateList: Array<DateInfo> = [
  {
    label: '5分钟',
    value: 5,
    type: 'minute',
    timeSlot: 10 * 1000, // 10秒
    format: 'mm分ss秒',
    id: 1,
  },
  {
    label: '15分钟',
    value: 15,
    type: 'minute',
    timeSlot: 60 * 1000, // 1分钟
    format: 'HH时mm分',
    id: 2,
  },
  {
    label: '30分钟',
    value: 30,
    type: 'minute',
    timeSlot: 60 * 1000, // 1分钟
    id: 3,
    format: 'HH时mm分',
  },
  {
    label: '1小时',
    value: 1,
    type: 'hour',
    timeSlot: 60 * 1000, // 1分钟
    format: 'HH时mm分',
    id: 4,
  },
  {
    label: '4小时',
    value: 4,
    type: 'hour',
    id: 5,
    timeSlot: 5 * 60 * 1000, // 5分钟
    format: 'HH时mm分',
  },
  {
    label: '1天',
    value: 1,
    type: 'day',
    id: 6,
    timeSlot: 30 * 60 * 1000, // 30分钟
    format: 'HH时mm分',
  },
  {
    label: '今天',
    value: 1,
    type: 'today',
    id: 7,
    timeSlot: 30 * 60 * 1000, // 30分钟
    format: 'HH时mm分',
  },
  {
    label: '1周',
    value: 1,
    type: 'week',
    id: 8,
    timeSlot: 12 * 60 * 60 * 1000, // 12小时
    format: 'DD日HH点',
  },
  {
    label: '本周',
    value: 1,
    type: 'thisWeek',
    id: 9,
    timeSlot: 12 * 60 * 60 * 1000, //12小时
    format: 'DD日HH点',
  },
  {
    label: '30天',
    value: 30,
    type: 'day',
    id: 10,
    timeSlot: 24 * 60 * 60 * 1000, // 12小时
    format: 'MM月DD日', // 相同的日和点会导致bug
  },
  {
    label: '本月',
    value: 1,
    type: 'thisMonth',
    id: 11,
    timeSlot: 24 * 60 * 60 * 1000, // 12小时
    format: 'MM月DD日HH点',
  },
  {
    label: '近半年',
    value: 6,
    type: 'month',
    id: 12,
    timeSlot: 24 * 60 * 60 * 1000, // 1天
    format: 'MM月DD日',
  },
  {
    label: '今年',
    value: 1,
    type: 'thisYear',
    id: 13,
    timeSlot: 24 * 60 * 60 * 1000, // 1天
    format: 'MM月DD日',
  },
  {
    label: '近一年',
    value: 1,
    type: 'year',
    id: 14,
    timeSlot: 24 * 60 * 60 * 1000, // 1天
    format: 'MM月DD日',
  },
]

export const selfDataList: Array<Pick<DateInfo, 'timeSlot' | 'format'>> = [
  {
    timeSlot: 2 * 60 * 60 * 1000, // 2小时 3天以上
    format: 'HH时mm分',
  },
  {
    timeSlot: 4 * 60 * 60 * 1000, // 4小时 7天
    format: 'DD日HH点',
  },
  {
    timeSlot: 12 * 60 * 60 * 1000, // 12小时  30天
    format: 'MM月DD日HH点', // 相同的日和点会导致bug
  },
  {
    timeSlot: 24 * 60 * 60 * 1000, // 1天  年
    format: 'MM月DD日',
  },
  {
    timeSlot: 10 * 60 * 1000, // 10分钟  小于等于4小时
    format: 'HH时mm分',
  },
  {
    timeSlot: 30 * 60 * 1000, // 30分钟 小于等于12小时
    format: 'HH时mm分',
  },
  {
    timeSlot: 60 * 60 * 1000, // 1小时 3天以下
    format: 'HH时mm分',
  },
]
