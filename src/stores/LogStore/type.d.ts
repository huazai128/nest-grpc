import { DateSelectProps } from '@src/components/DateSelect'
import { PageInfo, RequestUrlParams } from '@src/components/SearchData/List/store'
import { DateInfo, SearchOption, TimeValue } from '@src/interfaces/search.interface'
import { LogStore as LogStoreModel } from './index'
import { Dayjs } from 'dayjs'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'

export as namespace ILogStore

export type LogStore = LogStoreModel

export type LogSearch = RequestUrlParams & SearchOption<TimeValue> & { keywordParmas?: string }

export type LogChartSearch = Omit<SearchOption, 'time'>

export type LogResponse = ResponsePaginationData<LogItem>

export type LogAggregationResponse = ResponsePaginationData<AggDataItem>

export type LogChartResponse = Array<LogChartItem>
export interface LogItem {
  [key: string]: any
}

export interface LogChartItem {
  value: number
  id: string
  date: string
}

export interface AggDataItem {
  path: string
  value: number
  ratio: string
}
