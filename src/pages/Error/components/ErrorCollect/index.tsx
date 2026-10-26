import DataCard from '@src/components/DataCard'
import { SwitchTimeHead } from '@src/components/TitleHead'
import { Card, Divider, Space, Spin } from 'antd'
import { Dayjs } from 'dayjs'
import { useState } from 'react'
import { errorApi } from '@src/services/api'
import { globalStore } from '@src/stores'
import { observer } from 'mobx-react-lite'
import { ChangeItem, DateSingle, calculateChanges } from '@src/utils/chartDate'
import { ErrorSingleDay } from '@src/interfaces/chart.interface'
import { ErrorTypeKey } from '@src/interfaces/log.interface'
import { errorNameList, errorTypeList } from '@src/constants/error.content'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'

type ErrorSingleData = DateSingle<ErrorSingleDay>

type ErrorData = ErrorTypeKey & { total: number }

const ErrorCollect = () => {
  const [list, setList] = useState<Array<ChangeItem>>([])
  const [isLoading, setIsLoading] = useState(false)
  const getErrorCountData = async (date: Array<Dayjs>) => {
    setIsLoading(true)
    const { message, status, result } = await errorApi.getErrorCount<ErrorSingleData>({
      siteId: globalStore.siteId,
      startTime: date[0].valueOf(),
      endTime: date[1].valueOf(),
    })
    if (Object.is(status, 'success')) {
      let nData: any = {}
      for (let [k, value] of Object.entries(result)) {
        const total = value?.total || 0
        const list = value?.data || []
        const data = list.reduce((result: any, item: any) => {
          if (result[item.type]) {
            result[item.type] += item.count
          } else {
            result[item.type] = item.count
          }
          return result
        }, {})
        nData[k] = { total: total, ...data }
      }
      const res = calculateChanges<ErrorData>(nData, ['total', ...errorTypeList])
      setList(res)
    }
    setIsLoading(false)
  }
  return (
    <Card className="mbottom-24">
      <SwitchTimeHead onSwitchChange={getErrorCountData} title="错误数据统计" />
      <Space className={isLoading ? 'spaceLoading' : 'spaceBox'} split={<Divider type="vertical" />}>
        {isLoading ? (
          <Spin />
        ) : (
          list.map((item, index: number) => (
            <DataCard
              key={index}
              name={errorNameList[item.type] || ''}
              value={item.value}
              suffix="次"
              list={[
                { name: '较昨日', value: item.changePercentageYesterday, state: item.isIncreasedYesterday },
                { name: '7日前', value: item.changePercentageLastWeek, state: item.isIncreasedLastWeek },
              ]}
            />
          ))
        )}
      </Space>
    </Card>
  )
}

export default ErrorBoundaryHoc(observer(ErrorCollect), 'ErrorCollect')
