import DateSelect, { DateSelectRef } from '@src/components/DateSelect'
import PageContent from '@src/components/Page/PageContent'
import RcForm from '@src/components/RcForm'
import { CommonTimeHead } from '@src/components/TitleHead'
import { userLogApi } from '@src/services/api'
import { Card, Form } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { globalStore } from '@src/stores'
import RcEchart from '@src/components/RcEchart'
import { dateList } from '@src/components/DateSelect/data'
import dayjs from 'dayjs'

const WhiteScreen = () => {
  const form = Form.useForm()[0]

  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const selectRef = useRef<DateSelectRef>(null)

  const formItems = [
    {
      name: 'time',
      label: '日期',
      children: <DateSelect selectRef={selectRef} />,
    },
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const {
        value: [startTime, endTime],
        selectInfo: { timeSlot, format },
      } = values.time || {}
      const res = await userLogApi.getuserLogChartList({
        startTime: +startTime,
        endTime: +endTime,
        kw: '白屏检测自动反馈',
        siteId: globalStore.siteId,
        timeSlot,
      })
      const newList = (res.result || []) as any[]
      setList(
        newList?.map((item: any) => {
          try {
            return {
              ...item,
              startTime: dayjs(item.startTime).format(format),
            }
          } catch {
            return item
          }
        }),
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const today = dateList.find((item) => item.type === 'today')
    today && selectRef.current?.onSelectTime?.(today)
    const timer = setTimeout(() => {
      fetchData()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <PageContent title="白屏数据分析" style={{ background: '#e7e7e7', overflowY: 'auto' }}>
      <Card className="mbottom-24">
        <CommonTimeHead style={{ marginBottom: '24px' }} title="白屏数统计" />
        <RcForm form={form} formItems={formItems} loadFetch={fetchData} loading={loading} />
        <Card bordered={false}>
          <RcEchart height={110} data={list} xField="startTime" yField="count" />
        </Card>
      </Card>
    </PageContent>
  )
}

export default WhiteScreen
