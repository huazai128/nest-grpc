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
    title: '最大时间',
    dataIndex: 'max',
    key: 'max',
  },
  {
    title: '最小时间',
    dataIndex: 'min',
    key: 'min',
  },
  {
    title: '平均时间',
    dataIndex: 'avg',
    key: 'avg',
  },
  {
    title: '次数',
    dataIndex: 'count',
    key: 'count',
  },
]

const TimeConsuming = ({ title, type }: PrefItem) => {
  const [list, setList] = useState<Array<ILogStore.AggDataItem>>([])
  const [isLoadding, setIsLoadding] = useState(false)
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    size: 10,
    total: 0,
  })
  const dateRef = useRef<Array<Dayjs>>([])

  const getPageData = (date: Array<Dayjs>) => {
    dateRef.current = date
    getPathData()
  }

  const onPageChange = (page: number) => {
    setPageInfo((info) => ({ ...info, page }))
    getPathData(page)
  }

  const getPathData = async (nPage?: number) => {
    if (isLoadding) return
    setIsLoadding(true)
    const { page, size } = pageInfo
    const { result, status } = await prefApi.getTimeConsuming<ILogStore.LogAggregationResponse>({
      startTime: dateRef.current[0].valueOf(),
      endTime: dateRef.current[1].valueOf(),
      reportsType: type,
      page: nPage || page,
      siteId: globalStore.siteId,
      size,
    })
    if (Object.is(status, 'success')) {
      const total = result.pagination?.total || 0
      setPageInfo(() => ({ ...pageInfo, page: nPage || page, total }))
      const list = result?.data || []
      setList(list)
    }
    setIsLoadding(false)
  }

  return (
    <Card className={styles.prefCard}>
      <SwitchTimeHead isTodayStart onSwitchChange={(date) => getPageData(date)} title={title} />
      <div className="mbottom-24">
        <AggregationData
          columns={columns}
          pagination={{
            pageSize: pageInfo.size,
            total: pageInfo.total,
            current: pageInfo.page,
            onChange: onPageChange,
          }}
          loading={isLoadding}
          dataSource={list}
        />
      </div>
    </Card>
  )
}

export default TimeConsuming
