export interface ChartItem {
  count: number
  startTime: string
  endTime: string
}

export interface SingleItem {
  totalPv: number
  totalUv: number
}

export interface ErrorType {
  type: string
  count: number
  startTime: string
}

export interface ErrorSingleDay {
  total: number
  data: Array<ErrorType>
}
