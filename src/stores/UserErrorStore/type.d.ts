import { UserLogStore as UserLogStoreModal } from './index'
import { IParams } from '@src/components/RcTable/Table/store'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { SearchOption, TimeValue } from '@src/interfaces/search.interface'
import { MetricsName, TransportCategory } from '@src/types'

export as namespace IUserLogStore

export interface UserLogItem {
  siteId: string
  reportsType: MetricsName
  lang: string
  ua_result: Record<string, any>
  winScreen?: string
  docScreen?: string
  userId?: string | null
  title?: string
  path?: string
  href?: string
  referrer?: string
  prevHref?: string
  jumpType?: string
  type?: string
  effectiveType?: string
  ip: string
  ip_location?: Record<string, any>
  category: TransportCategory
  content?: string
  otherInfo?: Record<string, any>
  errorList?: Array<any>
  events?: Array<any>
  breadcrumbs: Array<any>
  create_at?: string
  id: number
}

export type UserLogStore = UserLogStoreModal

export type UserLogSearch = IParams & SearchOption<TimeValue>

export type UserLogResponse = ResponsePaginationData<UserLogItem>

export type UserLogChartSearch = Omit<SearchOption, 'time'>
