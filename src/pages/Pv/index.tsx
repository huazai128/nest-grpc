import styles from './style.scss'
import { Card, Divider, Form, FormItemProps, Input, Space, Spin } from 'antd'
import DataCard from '@src/components/DataCard'
import LineEchart from '@src/components/RcEchart/LineEchart'
import { CommonTimeHead, SwitchTimeHead } from '@src/components/TitleHead'
import RcForm from '@src/components/RcForm'
import RouteSelect from '@src/components/RouteSelect'
import DateSelect from '@src/components/DateSelect'
import { observer, useLocalObservable } from 'mobx-react-lite'
import pvStore from './store'
import { useEffect } from 'react'
import PageContent from '@src/components/Page/PageContent'
import PageStatistics from './components/PageStatistics'

const formItems: Array<FormItemProps> = [
  {
    name: 'path',
    label: '页面路由',
    children: <RouteSelect allowClear width="300px" showSearch />,
  },
  {
    name: 'keyId',
    label: '用户ID/IP',
    children: <Input style={{ width: '200px' }} placeholder="请输入用户ID或者IP查询" />,
  },
  {
    name: 'kw',
    label: '关键字搜索',
    children: <Input style={{ width: '200px' }} placeholder="请输入关键字搜索" />,
  },
  {
    name: 'time',
    label: '日期',
    children: <DateSelect />,
  },
]

const Pv = () => {
  const form = Form.useForm()[0]
  const store = useLocalObservable(() => pvStore)
  const { chartList, signData, singleLoading, getSingleDay, getPvDataChart, updateForm } = store

  useEffect(() => {
    updateForm(form)
    getPvDataChart()
  }, [])

  return (
    <PageContent title="PV相关数据分析" className={styles.pvBox}>
      <Card className="mbottom-24">
        <SwitchTimeHead onSwitchChange={getSingleDay} title="PV/UV访问指标概况" />
        <Space className={singleLoading ? 'spaceLoading' : 'spaceBox'} split={<Divider type="vertical" />}>
          {singleLoading ? (
            <Spin />
          ) : (
            signData.map((item, index) => (
              <DataCard
                key={index}
                name={item.type == 'totalUv' ? 'UV(独立访客数)' : 'PV(页面访问量)'}
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
      <Card className="mbottom-24">
        <CommonTimeHead style={{ marginBottom: '24px' }} title="PV/UV指标趋势" />
        <RcForm form={form} formItems={formItems} loadFetch={getPvDataChart} />
        <LineEchart
          data={chartList}
          xField="startTime"
          yField="value"
          seriesField="type"
          // yAxis={{ minLimit: 1, maxLimit: 10000000000000000 }}
        />
      </Card>
      <PageStatistics />
    </PageContent>
  )
}

export default observer(Pv)
