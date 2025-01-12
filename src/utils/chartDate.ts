import dayjs from 'dayjs'

/**
 * 处理echart时间分片数据格式
 * @export
 * @param {number} startTime
 * @param {number} endTime
 * @param {number} timeSlot
 */
export interface ChartDateProps<T> {
  startTime: number
  endTime: number
  timeSlot: number
  data: Array<T & ChartDateItem>
  format: string
  splitKeys?: Array<string>
}

export interface ChartDateItem {
  startTime: string
  hour?: number
  [key: string]: any
}

/**
 * 处理数据方便图表展示
 * @export
 * @template T
 * @param {ChartDateProps<T>} arg
 * @return {*}  {Array<T>}
 */
export function chartDate<T>(arg: ChartDateProps<T>): Array<T>
export function chartDate<T>(...arg: ChartDateProps<T>[]): Array<T> {
  const option = arg[0]
  const { startTime, endTime, timeSlot, data, format, splitKeys } = option
  const startT = dayjs(startTime).startOf('day').valueOf()
  const nLen = Math.floor((startTime - startT) / timeSlot)
  const nStartTime = startT + nLen * timeSlot
  const len = Math.ceil((endTime - nStartTime) / timeSlot)
  let list: Array<T> = []
  Array.from({ length: len }).map((_, index) => {
    const sTime = dayjs(nStartTime).add(timeSlot * index)
    const eTime = dayjs(nStartTime).add(timeSlot * (index + 1))
    const curData = data.find((item) => {
      return (
        dayjs(item?.startTime)
          .add(item.hour || 0, 'hour')
          .valueOf() === dayjs(sTime).valueOf()
      )
    })
    if (splitKeys) {
      const curList = splitKeys.map(
        (type) =>
          ({
            ...curData,
            startTime: index == 0 ? dayjs(startTime).format(format) : sTime.format(format),
            endTime: eTime.format(format),
            type: type,
            value: curData?.[type] || 0,
            count: Number(curData?.count || 0),
          }) as unknown as T,
      )
      list = [...list, ...curList]
    } else {
      list.push({
        ...curData,
        startTime: sTime.format(format),
        endTime: eTime.format(format),
        count: Number(curData?.count || 0),
      } as unknown as T)
    }
  })
  return list.map((item, index) => ({ ...item, index }))
}

// 单个统计
export interface DateSingle<T> {
  today: T
  yesterday: T
  lastWeek: T
}

export interface ChangeItem {
  changePercentageYesterday: number
  changePercentageLastWeek: number
  isIncreasedYesterday: boolean
  isIncreasedLastWeek: boolean
  type: string
  value: number
}

/**
 * 处理数据升降比例
 * @export
 * @template T
 * @param {DateSingle<T>} data
 * @param {Array<string>} keys
 * @return {*}  {*}
 */
export function calculateChanges<T>(data: DateSingle<T>, keys: Array<string>): Array<ChangeItem> {
  const list: Array<ChangeItem> = []
  keys.forEach((key: string) => {
    const result: any = {}
    const tData = data.today as Record<string, number>
    const yData = data.yesterday as Record<string, number>
    const lData = data.lastWeek as Record<string, number>
    const tNumb = tData[key] || 0
    const yNumb = yData[key] || 0
    const lNumb = lData[key] || 0
    const changeYesterday = tNumb - yNumb
    const changeLastWeek = tNumb - lNumb
    result.changePercentageYesterday = yNumb !== 0 ? Number(((changeYesterday / yNumb) * 100).toFixed(2)) : 0
    result.changePercentageLastWeek = lNumb !== 0 ? Number(((changeLastWeek / lNumb) * 100).toFixed(2)) : 0
    result.isIncreasedYesterday = changeYesterday > 0
    result.isIncreasedLastWeek = changeLastWeek > 0
    result.value = tNumb
    result.type = key
    list.push(result)
  })
  return list
}

export interface HourChartItem {
  count: number
  startTime: string
}

export interface HourCategoryItem extends HourChartItem {
  category: string
}

export type HourChartObj = DateSingle<Array<HourChartItem>>

export type CategoryType = keyof DateSingle<HourCategoryItem>

const categoryType: Map<CategoryType, string> = new Map([
  ['today', '今日'],
  ['yesterday', '昨日'],
  ['lastWeek', '七天前'],
])

export function singleHourChartData(data: HourChartObj): Array<HourCategoryItem> {
  // 结束时间，为当前时间 处理成小时
  const endHour = dayjs().hour()
  const startOfDay = dayjs().startOf('day')
  const reulstList: Array<HourCategoryItem> = []
  const processedData: Array<HourCategoryItem> = Object.keys(data).flatMap((category: string) =>
    data[category as keyof HourChartObj].map((item: any) => ({
      ...item,
      category,
    })),
  )
  const len = 24
  Array.from({ length: len }).forEach((_, index) => {
    // 获取当前时间下的数据
    const curList: Array<HourCategoryItem> = processedData.filter((item) => {
      return dayjs(item.startTime).hour() === index
    })
    // 遍历key
    categoryList.forEach((category) => {
      // 根据category 获取数据
      const { count = 0 }: Partial<HourCategoryItem> =
        curList.find((item) => Object.is(item.category, category)) || {}
      // 如果是为today 并且当前时间的小时大于下标了，就不添加进去
      if (!(Object.is(category, 'today') && index > endHour)) {
        reulstList.push({
          category: categoryType.get(category) || '其他',
          count: count,
          startTime: startOfDay.add(index, 'hour').format('HH:mm'),
        })
      }
    })
  })
  return reulstList
}
