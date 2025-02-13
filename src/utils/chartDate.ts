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
  return keys.map((key: string) => {
    const {
      today: tData,
      yesterday: yData,
      lastWeek: lData,
    } = data as Record<keyof DateSingle<T>, Record<string, number>>

    const tNumb = tData[key] || 0
    const yNumb = yData[key] || 0
    const lNumb = lData[key] || 0

    const changeYesterday = tNumb - yNumb
    const changeLastWeek = tNumb - lNumb

    return {
      changePercentageYesterday: yNumb !== 0 ? Number(((changeYesterday / yNumb) * 100).toFixed(2)) : 0,
      changePercentageLastWeek: lNumb !== 0 ? Number(((changeLastWeek / lNumb) * 100).toFixed(2)) : 0,
      isIncreasedYesterday: changeYesterday > 0,
      isIncreasedLastWeek: changeLastWeek > 0,
      value: tNumb,
      type: key,
    }
  })
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

const categoryList: Array<CategoryType> = ['today', 'yesterday', 'lastWeek']

const categoryType: Map<CategoryType, string> = new Map([
  ['today', '今日'],
  ['yesterday', '昨日'],
  ['lastWeek', '七天前'],
])

/**
 * 处理单个时间段的图表数据
 * @param {HourChartObj} data
 * @return {*}  {Array<HourCategoryItem>}
 */
export function singleHourChartData(data: HourChartObj): Array<HourCategoryItem> {
  // 结束时间，为当前时间 处理成小时
  const endHour = dayjs().hour()
  const startOfDay = dayjs().startOf('day')
  const reulstList: Array<HourCategoryItem> = []

  // 处理数据,将数据按category分组并添加category字段
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
      // 修复跨年问题:使用dayjs解析时间并获取小时,不受年份影响
      const itemHour = dayjs(item.startTime).hour()
      return itemHour === index
    })

    // 遍历分类
    categoryList.forEach((category) => {
      // 根据category获取数据
      const { count = 0 }: Partial<HourCategoryItem> =
        curList.find((item) => Object.is(item.category, category)) || {}

      // 如果是today且当前小时大于index,则跳过(未来时间不显示)
      if (!(Object.is(category, 'today') && index > endHour)) {
        // 使用startOfDay作为基准时间,添加小时偏移,保证时间点正确
        const timePoint = startOfDay.add(index, 'hour')
        reulstList.push({
          category: categoryType.get(category) || '其他',
          count: count,
          // 只格式化时分,避免年月日的影响
          startTime: timePoint.format('HH:mm'),
        })
      }
    })
  })
  return reulstList
}
