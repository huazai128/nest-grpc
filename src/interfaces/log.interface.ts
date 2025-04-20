import { RequestUrlParams } from '@src/components/SearchData/List/store'
import { SearchOption, TimeValue } from '@src/interfaces/search.interface'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'

export type LogSearch = RequestUrlParams & SearchOption<TimeValue> & { keywordParmas?: string }

export type LogChartSearch = Omit<SearchOption<TimeValue>, 'time'>

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

export interface IPLocationResponse {
  ip: string
  country: string
  province: string
  city: string
  country_code: string
  region: string
  region_code: string
  zip: string
  latitude: number
  longitude: number
}
