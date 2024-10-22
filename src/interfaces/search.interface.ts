import { Dayjs, UnitTypeLong } from 'dayjs'

export interface DateInfo<T = any> {
  label: string
  value: number
  type: UnitTypeLong | T
  id: number
  timeSlot: number
  format: string
}

export interface SearchOption<T> {
  time: T
  kw?: string
  siteId: string
  startTime: number
  endTime: number
  timeSlot: number
  format: string
  keyId?: string
}

export interface TimeValue {
  value: Dayjs[]
  selectInfo: DateInfo<'today' | 'week' | 'thisWeek' | 'thisMonth' | 'thisYear'>
}
