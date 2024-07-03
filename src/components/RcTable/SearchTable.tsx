import { Divider, Layout, Space } from 'antd'
import React, { useMemo } from 'react'
import { FormBox, IFormProps } from './Form'
import { TableBox, ITableProps } from './Table'
import classNames from 'classnames'
import styles from './style.scss'

export type SearchTableProps<T> = {
  formProps?: Omit<IFormProps<T>, 'tableStore'>
  tableProps?: Omit<ITableProps<T>, 'tableStore'>
  className?: string
  children?: React.ReactNode
  tableStore: ITableProps<T>['tableStore']
  centerChildren?: React.ReactNode
}

export const SearchTable = <T extends object>({
  formProps,
  tableProps,
  children,
  tableStore,
  className = '',
}: SearchTableProps<T>) => {
  const cls = useMemo(() => classNames(styles['search-table-box'], 'flex-col', className), [className])
  return (
    <div className={cls}>
      <Layout.Content className={styles.searchContent}>
        <FormBox {...formProps} tableStore={tableStore} />
        {children}
      </Layout.Content>
      <TableBox<T> {...tableProps} tableStore={tableStore} />
    </div>
  )
}
