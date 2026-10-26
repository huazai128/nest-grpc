import AggregationData from '@src/components/AggregationData'
import { SwitchTimeHead } from '@src/components/TitleHead'
import { prefApi } from '@src/services/api'
import { globalStore } from '@src/stores'
import { MetricsName } from '@src/types'
import { Card } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { Dayjs } from 'dayjs'
import { useRef, useState } from 'react'
import styles from '../style.scss'

export interface PrefItem {
  title: string
  type: MetricsName
}

const columns: ColumnsType<any> = [
  {
    title: '页面路径',
    dataIndex: 'path',
    key: 'path',
    width: 200,
    fixed: 'left',
  },
  {
    title: '用户ID',
    dataIndex: 'userId',
    key: 'userId',
  },
  {
    title: 'UA信息',
    dataIndex: 'ua',
    key: 'ua',
  },
  {
    title: '最大耗时',
    dataIndex: 'maxTime',
    key: 'maxTime',
  },
]

const MaxTime = ({ title, type }: PrefItem) => {
  const [list, setList] = useState<Array<ILogStore.AggDataItem>>([])
  const [isLoadding, setIsLoadding] = useState(false)
  const dateRef = useRef<Array<Dayjs>>([])

  const getPageData = (date: Array<Dayjs>) => {
    dateRef.current = date
    getPathData()
  }

  const getPathData = async () => {
    if (isLoadding) return
    setIsLoadding(true)
    const { result, status } = await prefApi.getTimeMaxData<Array<any>>({
      startTime: dateRef.current[0].valueOf(),
      endTime: dateRef.current[1].valueOf(),
      reportsType: type,
      siteId: globalStore.siteId,
    })
    if (Object.is(status, 'success')) {
      setList(result)
    }
    setIsLoadding(false)
  }

  console.log(list, 'list')

  return (
    <Card className={styles.prefCard}>
      <SwitchTimeHead
        isTodayStart
        onSwitchChange={(date) => getPageData(date)}
        title={title + '(前20个最大耗时数据)'}
      />
      <div className="mbottom-24">
        <AggregationData columns={columns} pagination={false} loading={isLoadding} dataSource={list} />
      </div>
    </Card>
  )
}

export default MaxTime
