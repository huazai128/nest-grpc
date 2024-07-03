import React, { useEffect, useMemo, Fragment } from 'react'
import { Checkbox, Empty, Table, TableProps } from 'antd'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { toJS } from 'mobx'
import { TableStore } from '..'
import styles from './style.scss'

export interface ITableProps<T> extends Omit<TableProps<T>, 'dataSource' | 'rowKey'> {
  style?: React.CSSProperties
  isBatchOpt?: boolean
  tableStore: TableStore
}

export const TableBox = observer(
  <T extends object>({
    className,
    columns,
    rowSelection,
    pagination = {},
    isBatchOpt,
    scroll = {},
    tableStore,
    ...props
  }: ITableProps<T>) => {
    useEffect(() => {
      setTimeout(() => {
        tableStore.getFetchData()
      }, 10)

      return () => {
        tableStore.resetData()
      }
    }, [])

    const cls = useMemo(() => classNames(className, styles['st-table-box']), [className])
    return (
      <Fragment>
        {toJS(tableStore.list)?.length > 0 ? (
          <Table
            {...props}
            columns={columns}
            scroll={{ x: 'max-content', ...scroll }}
            className={cls}
            dataSource={toJS(tableStore.list)}
            rowKey={tableStore.rowKey}
            loading={tableStore.isLoading}
            rowSelection={
              isBatchOpt
                ? {
                    selectedRowKeys: tableStore.selectedKeys,
                    onSelect: tableStore.onSelect,
                    ...rowSelection,
                    columnTitle: (
                      <Checkbox
                        indeterminate={!tableStore.selectAll && !!tableStore.selectedKeys.length}
                        checked={tableStore.selectAll}
                        onClick={() => tableStore.onSelectAll(!tableStore.selectAll)}
                      />
                    ),
                  }
                : undefined
            }
            pagination={{
              current: tableStore.table.page,
              pageSize: tableStore.table.size,
              total: tableStore.total,
              showSizeChanger: false,
              showTotal: (total: number) => `共 ${total} 条`,
              onChange: tableStore.updatePageData,
              hideOnSinglePage: true,
              ...pagination,
            }}
          ></Table>
        ) : (
          <div
            style={{
              width: '100%',
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty />
          </div>
        )}
      </Fragment>
    )
  },
)
