import Page from '@src/components/Page'
import { Button, Descriptions, Input, FormItemProps, Modal, Typography, Space } from 'antd'
import { observer } from 'mobx-react-lite'
import useRootStore from '@src/stores/useRootStore'
import DateSelect from '@src/components/DateSelect'
import { SearchTable } from '@src/components/RcTable'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import CardChart from './components/CardChart'
import ErrorModal from './components/ErrorModal'
import { useMemo, useState } from 'react'
import LogModal from '@src/components/LogModal'

const networkLevelText: Record<string, string> = {
  normal: '正常',
  weak: '较慢',
  severe: '严重偏低',
  critical: '几乎不可用',
  'measurement-failed': '测速失败',
}

// 反馈日志保存的是测速原始值；详情弹窗统一在展示层补充中文含义和单位。
const formatBoolean = (value?: boolean | null) => (value === null || value === undefined ? '-' : value ? '是' : '否')

const formatNumber = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : String(Number(value.toFixed(3)))

const formatDurationSeconds = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : `${Number((value / 1000).toFixed(3))} 秒`

const formatFileSize = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value) ? '-' : `${Number((value / 1024).toFixed(3))} KB`

const formList: Array<FormItemProps> = [
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

const Logs = () => {
  const { userLogStore, logStore } = useRootStore()
  const { open, title, logInfo, type, hideModal } = logStore
  // 保存当前查看的反馈记录，网络详情仍直接读取原有 otherInfo.networkInfo，不额外请求接口。
  const [networkDetail, setNetworkDetail] = useState<IUserLogStore.UserLogItem | null>(null)
  const networkInfo = networkDetail?.otherInfo?.networkInfo

  const columns: ColumnsType<IUserLogStore.UserLogItem> = useMemo(
    () => [
      {
        title: '用户ID',
        dataIndex: 'userId',
        fixed: 'left',
        width: 80,
      },
      {
        title: '用户IP',
        dataIndex: 'ip',
        width: 120,
      },
      {
        title: '小区ID',
        dataIndex: 'communityId',
        width: 120,
      },
      {
        title: '额外信息',
        dataIndex: 'extraInfo',
        width: 120,
        render(v) {
          return <div style={{ whiteSpace: 'pre' }}>{v}</div>
        },
      },
      {
        title: '网络等级',
        width: 100,
        render: (_, record) => {
          const currentNetworkInfo = record.otherInfo?.networkInfo
          // 历史反馈没有网络快照时保持原有兼容展示，也不提供无内容的详情入口。
          if (!currentNetworkInfo || typeof currentNetworkInfo !== 'object') return '-'

          const level = currentNetworkInfo.networkLevel
          return (
            <Space direction="vertical" size={0}>
              <span>{level ? networkLevelText[level] || level : '-'}</span>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setNetworkDetail(record)}>
                查看详情
              </Button>
            </Space>
          )
        },
      },
      {
        title: '提交内容',
        dataIndex: 'content',
        width: 160,
        render: (value: string) => value || '-',
      },
      {
        title: '附属信息',
        dataIndex: 'otherInfo',
        width: 160,
        render: (value: Record<string, any>) => (value instanceof Object ? JSON.stringify(value) : '-'),
      },
      {
        title: '页面路径',
        dataIndex: 'path',
        width: 160,
      },
      {
        title: 'UA信息',
        dataIndex: 'ua_result',
        width: 200,
        render: (value: Record<string, any>) => (value instanceof Object ? JSON.stringify(value) : '-'),
      },
      {
        title: '上报时间',
        dataIndex: 'create_at',
        render: (value: string) => (!!value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: '操作',
        dataIndex: 'id',
        render: (_, record: IUserLogStore.UserLogItem) => (
          <Space direction="vertical">
            <Typography.Link
              onClick={() => {
                userLogStore.showModal(record.id)
              }}
            >
              错误详情
            </Typography.Link>
            <Typography.Link
              onClick={() => {
                logStore.onModalUserShow('behavior', record, '查看用户行为')
              }}
            >
              查看用户行为
            </Typography.Link>
            <Typography.Link
              onClick={() => {
                window.open(`/action-detail/${record.id}`)
              }}
            >
              打开页面查看用户行为
            </Typography.Link>
            <Typography.Link
              onClick={() => {
                logStore.onModalUserShow('record', record, '查看录制')
              }}
            >
              查看录屏
            </Typography.Link>
          </Space>
        ),
        fixed: 'right',
      },
    ],
    [],
  )

  return (
    <>
      <Page title="用户日志上报">
        <SearchTable
          tableStore={userLogStore}
          formProps={{
            formItems: formList,
          }}
          tableProps={{
            columns,
            scroll: {
              y: 540,
            },
          }}
        >
          <CardChart />
        </SearchTable>
        <ErrorModal />
        <LogModal open={open} title={title} logInfo={logInfo} type={type} hideModal={hideModal} />
        {/* 将反馈携带的网络快照按可读单位展示；末尾保留原始数据，便于排查新增或异常字段。 */}
        <Modal
          title="网络信息详情"
          open={!!networkDetail}
          width={760}
          footer={null}
          destroyOnClose
          onCancel={() => setNetworkDetail(null)}
        >
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="测速是否成功">{formatBoolean(networkInfo?.success)}</Descriptions.Item>
            <Descriptions.Item label="网络等级">
              {networkInfo?.networkLevel
                ? networkLevelText[networkInfo.networkLevel] || networkInfo.networkLevel
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="是否弱网">{formatBoolean(networkInfo?.isWeakNetwork)}</Descriptions.Item>
            <Descriptions.Item label="浏览器网络类型">{networkDetail?.effectiveType || '-'}</Descriptions.Item>
            <Descriptions.Item label="上报网速">
              {networkInfo?.speedMbps == null ? '-' : `${formatNumber(networkInfo.speedMbps)} Mbps`}
            </Descriptions.Item>
            <Descriptions.Item label="平均下载速率">
              {networkInfo?.speedKBps == null ? '-' : `${formatNumber(networkInfo.speedKBps)} KB/s`}
            </Descriptions.Item>
            <Descriptions.Item label="测速图片加载耗时">
              {networkInfo?.durationMs == null ? '-' : `${formatNumber(networkInfo.durationMs)} ms`}
            </Descriptions.Item>
            <Descriptions.Item label="测速图片大小">{formatFileSize(networkInfo?.imageSizeBytes)}</Descriptions.Item>
            <Descriptions.Item label="最大资源大小">
              {formatFileSize(networkInfo?.maxResourceSizeBytes)}
            </Descriptions.Item>
            <Descriptions.Item label="预计最大资源下载耗时">
              {formatDurationSeconds(networkInfo?.estimatedMaxResourceDownloadDurationMs)}
            </Descriptions.Item>
            <Descriptions.Item label="入口耗时">
              {formatDurationSeconds(networkInfo?.entryDurationMs)}
            </Descriptions.Item>
            <Descriptions.Item label="FCP耗时">{formatDurationSeconds(networkInfo?.fcpDurationMs)}</Descriptions.Item>
            <Descriptions.Item label="LCP耗时">{formatDurationSeconds(networkInfo?.lcpDurationMs)}</Descriptions.Item>
            <Descriptions.Item label="测速时间">
              {networkInfo?.measuredAt ? dayjs(networkInfo.measuredAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="失败类型">{networkInfo?.errorType || '-'}</Descriptions.Item>
            <Descriptions.Item label="原始网络信息" span={2}>
              <pre style={{ margin: 0, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {networkInfo ? JSON.stringify(networkInfo, null, 2) : '-'}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      </Page>
    </>
  )
}

export default observer(Logs)
