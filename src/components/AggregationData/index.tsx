import { Table } from 'antd'
import type { TableProps, ColumnsType } from 'antd/es/table'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'

const defaultColumns: ColumnsType<any> = [
  {
    title: '路径',
    dataIndex: 'name',
    key: 'name',
    width: 300,
  },
  {
    title: '数量',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '比例',
    dataIndex: 'ratio',
    key: 'ratio',
    render: (value) => `${value || 0}%`,
  },
]

const AggregationData = <T extends Record<string, any>>({
  dataSource,
  pagination,
  columns = defaultColumns,
  ...props
}: TableProps<T>) => {
  return (
    <Table
      columns={columns}
      bordered={false}
      dataSource={dataSource}
      scroll={!!dataSource?.length ? { x: 'max-content', y: 340 } : undefined}
      pagination={{
        showSizeChanger: false,
        ...pagination,
      }}
      {...props}
    ></Table>
  )
}

export default ErrorBoundaryHoc(AggregationData, 'AggregationData')
