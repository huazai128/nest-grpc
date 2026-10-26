import DateSelect from '@src/components/DateSelect'
import Page from '@src/components/Page'
import RcEchart from '@src/components/RcEchart'
import { SearchTable } from '@src/components/RcTable'
import useRootStore from '@src/stores/useRootStore'
import { Button, Card, Descriptions, FormItemProps, Input, Modal, Select, Tag, Tooltip, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'

const NETWORK_LEVEL_TEXT: Record<string, string> = {
  normal: '正常',
  weak: '较慢',
  severe: '严重偏低',
  critical: '几乎不可用',
  'measurement-failed': '测速失败',
}

const getNetworkLevelText = (value?: string | null) => (value ? NETWORK_LEVEL_TEXT[value] || value : '-')

// 与服务端保持一致：弱网且 FCP 超过 1 秒或缺失时，才属于本次网络告警。
const isNetworkAlarm = (record: INetworkSpeedStore.NetworkSpeedItem) =>
  (record.mode === 'test' || record.mode === 'prod') &&
  record.parseSuccess === true &&
  record.success === true &&
  ['weak', 'severe', 'critical'].includes(record.networkLevel || '') &&
  (record.fcpDurationMs == null || record.fcpDurationMs > 1000)

const getAlarmTypeText = (record: INetworkSpeedStore.NetworkSpeedItem) => {
  if (!isNetworkAlarm(record)) return '-'
  if (record.networkLevel === 'critical') return '网速几乎不可用'
  if (record.networkLevel === 'severe') return '网速严重偏低'
  if (record.networkLevel === 'weak') return '网速较慢'
  return '-'
}

const formatNumber = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : String(Number(value.toFixed(3)))

const formatDurationSeconds = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : `${Number((value / 1000).toFixed(3))} 秒`

const formatBoolean = (value?: boolean | null) => (value === null || value === undefined ? '-' : value ? '是' : '否')

const formItems: FormItemProps[] = [
  {
    name: 'keyId',
    label: '用户ID/IP',
    children: <Input style={{ width: 200 }} placeholder="请输入用户ID或者IP" />,
  },
  {
    name: 'success',
    label: '测速是否成功',
    children: (
      <Select
        allowClear
        style={{ width: 120 }}
        options={[
          { label: '成功', value: 'true' },
          { label: '失败', value: 'false' },
        ]}
      />
    ),
  },
  {
    name: 'networkLevel',
    label: '网络等级',
    children: (
      <Select
        allowClear
        style={{ width: 140 }}
        options={[
          { label: '正常', value: 'normal' },
          { label: '较慢', value: 'weak' },
          { label: '严重偏低', value: 'severe' },
          { label: '几乎不可用', value: 'critical' },
          { label: '测速失败', value: 'measurement-failed' },
        ]}
      />
    ),
  },
  {
    name: 'isAlarm',
    label: '是否弱网/告警',
    children: (
      <Select
        allowClear
        style={{ width: 100 }}
        options={[
          { label: '是', value: 'true' },
          { label: '否', value: 'false' },
        ]}
      />
    ),
  },
  {
    name: 'time',
    label: '日期',
    children: <DateSelect />,
  },
]

const EmptyValue = ({ value }: { value: unknown }) => (
  <>{value === null || value === undefined || value === '' ? '-' : String(value)}</>
)

const LongText = ({ value }: { value: unknown }) => {
  const text = value && typeof value === 'object' ? JSON.stringify(value) : value == null ? '-' : String(value)
  return (
    <Tooltip title={text}>
      <div style={{ width: 180, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{text}</div>
    </Tooltip>
  )
}

const DetailValue = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || value === '') return <>-</>
  if (typeof value === 'object') {
    return (
      <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  return <Typography.Text copyable>{String(value)}</Typography.Text>
}

const getProjectName = (siteId: INetworkSpeedStore.NetworkSpeedItem['siteId']) =>
  siteId && typeof siteId === 'object' ? siteId.name : '-'

const NetworkAnalysis = () => {
  const { networkSpeedStore } = useRootStore()
  const [detail, setDetail] = useState<INetworkSpeedStore.NetworkSpeedItem | null>(null)

  const columns: ColumnsType<INetworkSpeedStore.NetworkSpeedItem> = useMemo(
    () => [
      {
        title: '上报时间',
        dataIndex: 'create_at',
        fixed: 'left',
        width: 165,
        render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: '用户ID',
        dataIndex: 'userId',
        fixed: 'left',
        width: 120,
        render: (value) => <EmptyValue value={value} />,
      },
      { title: '环境', dataIndex: 'mode', width: 80, render: (value) => <EmptyValue value={value} /> },
      { title: '项目', dataIndex: 'siteId', width: 120, render: getProjectName },
      { title: '小区ID', dataIndex: 'communityId', width: 120, render: (value) => <EmptyValue value={value} /> },
      { title: '小区名称', dataIndex: 'communityName', width: 160, render: (value) => <EmptyValue value={value} /> },
      { title: '组织ID', dataIndex: 'orgId', width: 110, render: (value) => <EmptyValue value={value} /> },
      { title: '组织名称', dataIndex: 'orgName', width: 160, render: (value) => <EmptyValue value={value} /> },
      { title: '团队ID', dataIndex: 'teamId', width: 110, render: (value) => <EmptyValue value={value} /> },
      {
        title: '测速是否成功',
        dataIndex: 'success',
        width: 120,
        render: (value: boolean | null) =>
          value == null ? '-' : <Tag color={value ? 'green' : 'red'}>{value ? '成功' : '失败'}</Tag>,
      },
      {
        title: '网络等级',
        dataIndex: 'networkLevel',
        width: 110,
        render: (value: string | null) => getNetworkLevelText(value),
      },
      {
        title: '是否弱网/告警',
        width: 130,
        render: (_, record) => formatBoolean(isNetworkAlarm(record)),
      },
      { title: '告警类型', width: 170, render: (_, record) => getAlarmTypeText(record) },
      { title: '用户IP', dataIndex: 'ip', width: 130, render: (value) => <EmptyValue value={value} /> },
      { title: '网络类型', dataIndex: 'effectiveType', width: 90, render: (value) => <EmptyValue value={value} /> },
      {
        title: '测速耗时',
        dataIndex: 'durationMs',
        width: 110,
        render: (value: number | null) => (value == null ? '-' : `${formatNumber(value)} ms`),
      },
      {
        title: '平均下载速率',
        dataIndex: 'speedKBps',
        width: 130,
        render: (value: number | null) => (value == null ? '-' : `${formatNumber(value)} KB/s`),
      },
      {
        title: '上报网速',
        dataIndex: 'speedMbps',
        width: 110,
        render: (value: number | null) => (value == null ? '-' : `${formatNumber(value)} Mbps`),
      },
      {
        title: '预计最大资源下载耗时',
        dataIndex: 'estimatedMaxResourceDownloadDurationMs',
        width: 190,
        render: formatDurationSeconds,
      },
      { title: '入口耗时', dataIndex: 'entryDurationMs', width: 110, render: formatDurationSeconds },
      { title: 'FCP耗时', dataIndex: 'fcpDurationMs', width: 110, render: formatDurationSeconds },
      { title: 'LCP耗时', dataIndex: 'lcpDurationMs', width: 110, render: formatDurationSeconds },
      {
        title: '测速页面',
        dataIndex: 'href',
        width: 200,
        render: (value, record) => <LongText value={value || record.path} />,
      },
      {
        title: '测速时间',
        dataIndex: 'measuredAt',
        width: 165,
        render: (value: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: '操作',
        fixed: 'right',
        width: 90,
        render: (_, record) => (
          <Button type="link" onClick={() => setDetail(record)}>
            查看详情
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <Page title="网络分析">
      <SearchTable
        tableStore={networkSpeedStore}
        formProps={{ formItems }}
        tableProps={{ columns, scroll: { x: 'max-content', y: 500 } }}
      >
        <Card bordered={false} style={{ paddingTop: 12 }}>
          <Typography.Title level={5}>测速上报次数</Typography.Title>
          <RcEchart height={150} data={toJS(networkSpeedStore.chartList)} xField="startTime" yField="count" />
        </Card>
      </SearchTable>

      <Modal
        title="网络测速详情"
        open={!!detail}
        width={900}
        footer={null}
        destroyOnClose
        onCancel={() => setDetail(null)}
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="测速图片大小">
            <DetailValue value={detail?.imageSizeBytes} />
          </Descriptions.Item>
          <Descriptions.Item label="最大资源大小">
            <DetailValue value={detail?.maxResourceSizeBytes} />
          </Descriptions.Item>
          <Descriptions.Item label="失败类型">
            <DetailValue value={detail?.errorType} />
          </Descriptions.Item>
          <Descriptions.Item label="页面标题">
            <DetailValue value={detail?.title} />
          </Descriptions.Item>
          <Descriptions.Item label="页面路径">
            <DetailValue value={detail?.path} />
          </Descriptions.Item>
          <Descriptions.Item label="完整页面地址">
            <DetailValue value={detail?.href} />
          </Descriptions.Item>
          <Descriptions.Item label="来源页面">
            <DetailValue value={detail?.referrer} />
          </Descriptions.Item>
          <Descriptions.Item label="上一页面">
            <DetailValue value={detail?.prevHref} />
          </Descriptions.Item>
          <Descriptions.Item label="窗口尺寸">
            <DetailValue value={detail?.winScreen} />
          </Descriptions.Item>
          <Descriptions.Item label="文档尺寸">
            <DetailValue value={detail?.docScreen} />
          </Descriptions.Item>
          <Descriptions.Item label="语言">
            <DetailValue value={detail?.lang} />
          </Descriptions.Item>
          <Descriptions.Item label="上报类型">
            <DetailValue value={detail?.reportsType} />
          </Descriptions.Item>
          <Descriptions.Item label="日志分类">
            <DetailValue value={detail?.category} />
          </Descriptions.Item>
          <Descriptions.Item label="跳转类型">
            <DetailValue value={detail?.jumpType} />
          </Descriptions.Item>
          <Descriptions.Item label="访问类型">
            <DetailValue value={detail?.type} />
          </Descriptions.Item>
          <Descriptions.Item label="事件分类">
            <DetailValue value={detail?.eventCategory} />
          </Descriptions.Item>
          <Descriptions.Item label="事件动作">
            <DetailValue value={detail?.eventAction} />
          </Descriptions.Item>
          <Descriptions.Item label="事件标签">
            <DetailValue value={detail?.eventLabel} />
          </Descriptions.Item>
          <Descriptions.Item label="事件ID">
            <DetailValue value={detail?.eventId} />
          </Descriptions.Item>
          <Descriptions.Item label="解析是否成功">
            <DetailValue value={detail?.parseSuccess} />
          </Descriptions.Item>
          <Descriptions.Item label="解析错误">
            <DetailValue value={detail?.parseError} />
          </Descriptions.Item>
          <Descriptions.Item label="UA信息" span={2}>
            <DetailValue value={detail?.ua_result} />
          </Descriptions.Item>
          <Descriptions.Item label="IP归属地" span={2}>
            <DetailValue value={detail?.ip_location} />
          </Descriptions.Item>
          <Descriptions.Item label="原始测速数据" span={2}>
            <DetailValue value={detail?.rawEventValue} />
          </Descriptions.Item>
          <Descriptions.Item label="数据库ID">
            <DetailValue value={detail?.id} />
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            <DetailValue value={detail?.update_at} />
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </Page>
  )
}

export default observer(NetworkAnalysis)
