import { IParams } from '@src/components/RcTable/Table/store'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { SearchOption, TimeValue } from '@src/interfaces/search.interface'
import { NetworkSpeedStore as NetworkSpeedStoreModel } from './index'

export as namespace INetworkSpeedStore

export type NetworkSpeedStore = NetworkSpeedStoreModel

export interface SiteName {
  name: string
}

export interface NetworkSpeedItem {
  id: number
  siteId: string | SiteName
  reportsType: string
  category: string
  lang: string
  ua_result: Record<string, any> | null
  winScreen: string | null
  docScreen: string | null
  userId: string | null
  title: string | null
  path: string | null
  href: string | null
  referrer: string | null
  prevHref: string | null
  jumpType: string | null
  type: number
  effectiveType: string | null
  mode: string
  ip: string | null
  ip_location: Record<string, any> | null
  eventCategory: string
  eventAction: string
  eventLabel: string
  eventId: number
  success: boolean | null
  imageSizeBytes: number | null
  durationMs: number | null
  speedKBps: number | null
  speedMbps: number | null
  networkLevel: string | null
  maxResourceSizeBytes: number | null
  estimatedMaxResourceDownloadDurationMs: number | null
  entryDurationMs: number | null
  fcpDurationMs: number | null
  lcpDurationMs: number | null
  communityId: string | null
  communityName: string | null
  orgId: string | null
  orgName: string | null
  teamId: string | null
  isWeakNetwork: boolean
  errorType: string | null
  measuredAt: string | null
  parseSuccess: boolean
  parseError: string | null
  rawEventValue: string | null
  create_at: string
  update_at: string
}

export type NetworkSpeedSearch = IParams &
  SearchOption<TimeValue> & {
    mode?: string
    success?: string
    networkLevel?: string
    isWeakNetwork?: string
    isAlarm?: string
  }

export type NetworkSpeedResponse = ResponsePaginationData<NetworkSpeedItem>

export type NetworkSpeedChartSearch = Omit<NetworkSpeedSearch, 'time' | 'page' | 'size'>

export interface NetworkSpeedChartItem {
  startTime: string
  count: number
}
