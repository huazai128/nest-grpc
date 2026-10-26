import PageContent from '@src/components/Page/PageContent'
import LineEchart from '@src/components/RcEchart/LineEchart'
import RcForm from '@src/components/RcForm'
import { CommonTimeHead } from '@src/components/TitleHead'
import { log } from '@src/services/api'
import GlobalStore from '@src/stores/GlobalStore'
import { chartDate } from '@src/utils/chartDate'
import { Card, Form, Input, DatePicker } from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
const { RangePicker } = DatePicker
const keys = [
  'avgTotalSize',
  'avgUsedSize',
  'avgLimitSize',
  'maxTotalSize',
  'maxUsedSize',
  'maxLimitSize',
  'minTotalSize',
  'minUsedSize',
  'minLimitSize',
]

const formItems = [
  {
    name: 'keyId',
    label: '用户ID',
    children: <Input maxLength={20} placeholder="请输入用户ID" />,
  },
  {
    name: 'time',
    label: '日前',
    children: <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />,
  },
]

const Memory = () => {
  const form = Form.useForm()[0]
  const [loading, setLoading] = useState(false)
  const [list, setlist] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { time, ...values } = form.getFieldsValue()
    if (!!time) {
      values.startTime = dayjs(time[0]).valueOf()
      values.endTime = dayjs(time[1]).valueOf()
    }
    const { result } = await log.getMemoryData<any[]>({
      ...values,
      siteId: GlobalStore.siteId,
    })
    const data = (result || []).map((item) => {
      const obj: any = {}
      for (const key of Object.keys(item)) {
        obj[key] = keys.includes(key) ? Number(item[key].toFixed(2)) : item[key]
      }
      return obj
    })
    const list = chartDate({
      startTime: values.startTime,
      endTime: values.endTime,
      timeSlot: 60 * 1000,
      format: 'HH时mm分',
      data: data,
      splitKeys: keys,
    })
    setLoading(false)
    setlist(list)
  }

  return (
    <PageContent title="内存" style={{ background: '#e7e7e7', overflowY: 'auto' }}>
      <Card className="mbottom-24">
        <CommonTimeHead style={{ marginBottom: '24px' }} title="用户内存使用" />
        <RcForm
          form={form}
          formItems={formItems}
          loadFetch={fetchData}
          loading={loading}
          initialValues={{ time: [dayjs().subtract(1, 'h'), dayjs()] }}
        />
        <Card bordered={false}>
          <LineEchart
            data={list}
            xField="startTime"
            yField="value"
            seriesField="type"
            // yAxis={{ minLimit: 1, maxLimit: 10000000000000000 }}
          />
        </Card>
      </Card>
    </PageContent>
  )
}

export default Memory
