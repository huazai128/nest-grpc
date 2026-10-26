import AggregationData from '@src/components/AggregationData'
import LineEchart from '@src/components/RcEchart/LineEchart'
import { CommonTimeHead, SwitchTimeHead } from '@src/components/TitleHead'
import { pvApi } from '@src/services/api'
import { globalStore } from '@src/stores'
import { Card, Col, Row } from 'antd'
import { Dayjs } from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { HourCategoryItem, HourChartObj, singleHourChartData } from '@src/utils/chartDate'

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
    const { result, status } = await pvApi.getStatisticsPathData<ILogStore.LogAggregationResponse>({
      startTime: dateRef.current[0].valueOf(),
      endTime: dateRef.current[1].valueOf(),
      page: nPage || page,
      siteId: globalStore.siteId,
      size,
    })
    if (Object.is(status, 'success')) {
      const total = result.pagination?.total || 0
      const dataTotal = result.pagination?.dataTotal || 0
      setPageInfo(() => ({ ...pageInfo, page: nPage || page, total }))
      const list = (result?.data || []).map((item) => ({
        ...item,
        ratio: ((item.value / dataTotal) * 100).toFixed(2),
      }))
      setList(list)
    }
    setIsLoadding(false)
  }
  return (
    <Card>
      <SwitchTimeHead isTodayStart onSwitchChange={(date) => getPageData(date)} title="浏览器统计信息" />
      <div className="mbottom-24">
        <AggregationData
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

const HourStatistics = () => {
  const [list, setList] = useState<Array<HourCategoryItem>>([])

  useEffect(() => {
    getInit()
  }, [])

  const getInit = async () => {
    const { result, status, message } = await pvApi.getSingleDayPathData<HourChartObj>({
      siteId: globalStore.siteId,
    })
    const nList = singleHourChartData(result)
    setList(nList)
  }

  return (
    <Card>
      <CommonTimeHead style={{ marginBottom: '24px' }} title="页面访问实时数据" />
      <LineEchart data={list} xField="startTime" yField="count" seriesField="category" />
    </Card>
  )
}

const PageStatistics = () => {
  return (
    <Row gutter={16} className="mbottom-24">
      <Col span={10}>
        <TotalPageStatistics />
      </Col>
      <Col span={14}>
        <HourStatistics />
      </Col>
    </Row>
  )
}

export default PageStatistics
