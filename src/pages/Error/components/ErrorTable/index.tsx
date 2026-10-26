import DateSelect from '@src/components/DateSelect'
import RcForm from '@src/components/RcForm'
import RouteSelect from '@src/components/RouteSelect'
import { CommonTimeHead } from '@src/components/TitleHead'
import useRootStore from '@src/stores/useRootStore'
import { Card, Form, FormItemProps, Select, Table, Typography } from 'antd'
import { observer, useLocalObservable } from 'mobx-react-lite'
import eStore, { ErrorAggregateItem, TabItem } from './store'
import { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo } from 'react'
import { toJS } from 'mobx'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'
import LogModal from '@src/components/LogModal'

const tabList: TabItem[] = [
  {
    name: '默认',
    key: '1',
    render: <>12</>,
  },
]

const SelectErrorType = observer((props) => {
  const { globalStore } = useRootStore()
  return (
    <Select placeholder="请选择错误类型" style={{ width: '200px' }} {...props}>
      {globalStore.errorTypeList.map((item) => (
        <Select.Option key={item.value} value={item.value}>
          {item.label}
        </Select.Option>
      ))}
    </Select>
  )
})

const formItems: Array<FormItemProps> = [
  {
    name: 'reportsType',
    label: '错误类型',
    children: <SelectErrorType />,
  },
  {
    name: 'time',
    label: '日期',
    children: <DateSelect />,
  },
]

const ErrorTable = () => {
  const form = Form.useForm()[0]
  const { pageInfo, dataSource, getErrorData, updateForm, updatePage } = useLocalObservable(() => eStore)
  const { userLogStore } = useRootStore()
  const { open, title, logInfo, type, hideModal, onModalType } = userLogStore
  useEffect(() => {
    updateForm(form)
  }, [])

  const columns: ColumnsType<ErrorAggregateItem> = useMemo(
    () => [
      {
        title: '页面路由',
        dataIndex: 'path',
        key: 'path',
        width: 200,
        render: (value: string) => value || '-',
      },

      {
        title: '错误值',
        dataIndex: 'value',
        key: 'value',
        width: 150,
        render: (value: string) => value || '-',
      },
      {
        title: '错误次数',
        dataIndex: 'count',
        key: 'count',
        width: 100,
      },
      {
        title: '比例',
        dataIndex: 'ratio',
        key: 'ratio',
        width: 100,
        render: (value) => `${value || 0}%`,
      },
      {
        title: '错误详情',
        dataIndex: 'errorList',
        key: 'errorList',
        width: 200,
        render: (values: ErrorAggregateItem['errorList']) => {
          const meta = values[0]?.meta || {}
          const isObject = typeof meta === 'object' && meta !== null
          return isObject ? JSON.stringify(meta) : meta || '-'
        },
      },
      {
        title: '操作',
        dataIndex: 'controll',
        key: 'controll',
        fixed: 'right',
        render: (_, item: ErrorAggregateItem) => {
          const errorId = item.errorList?.[0]?.errorUUid
          return errorId ? (
            <Typography.Link onClick={() => onModalType('behavior', { errorUUid: errorId }, '查看用户行为')}>
              查看错误
            </Typography.Link>
          ) : (
            '无操作'
          )
        },
      },
    ],
    [],
  )

  return (
    <>
      <Card className="mbottom-24">
        <CommonTimeHead style={{ marginBottom: '24px' }} title="错误数据趋势" />
        <RcForm form={form} formItems={formItems} loadFetch={getErrorData} />
        <Table
          columns={columns}
          dataSource={toJS(dataSource)}
          scroll={!!dataSource.length ? { x: 'max-content', y: 340 } : undefined}
          pagination={{
            showSizeChanger: false,
            current: pageInfo.page,
            pageSize: pageInfo.size,
            total: pageInfo.total,
            onChange: updatePage,
          }}
        ></Table>
      </Card>
      <LogModal open={open} title={title} logInfo={logInfo} type={type} hideModal={hideModal} />
    </>
  )
}

export default ErrorBoundaryHoc(observer(ErrorTable), 'ErrorTable')
