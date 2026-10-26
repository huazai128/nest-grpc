import AggregationData from '@src/components/AggregationData'
import { SwitchTimeHead } from '@src/components/TitleHead'
import { pvApi } from '@src/services/api'
import { globalStore } from '@src/stores'
import { Card, Col, Row } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { Dayjs } from 'dayjs'
import { useRef, useState } from 'react'

const columns: ColumnsType<any> = [
  {
    title: '浏览器名称',
    dataIndex: 'name',
    key: 'name',
    width: 300,
  },
  {
    title: '浏览器版本',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: 'UA信息',
    dataIndex: 'ua',
    key: 'ua',
    width: 300,
  },
  {
    title: '使用量',
    dataIndex: 'count',
    key: 'count',
    fixed: 'right',
  },
]

const TotalPageStatistics = () => {
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
    const { result, status } = await pvApi.getStatisticsEquipment<ILogStore.LogAggregationResponse>({
      startTime: dateRef.current[0].valueOf(),
      endTime: dateRef.current[1].valueOf(),
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
    <Card>
      <SwitchTimeHead isTodayStart onSwitchChange={(date) => getPageData(date)} title="统计浏览数据" />
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

const PageStatistics = () => {
  return (
    <Row gutter={16} className="mbottom-24">
      <Col span={24}>
        <TotalPageStatistics />
      </Col>
    </Row>
  )
}

export default PageStatistics
