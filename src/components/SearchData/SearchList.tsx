import { useEffect, useMemo, useState } from 'react'
import FormBox, { IFormProps } from './Form'
import ListBox, { IListProps } from './List'
import { Space, Pagination, Layout, Menu, Checkbox } from 'antd'
import { observer } from 'mobx-react-lite'
import styles from './style.scss'
import type { MenuProps } from 'antd'
import { CursorPagination } from './CursorPagination'

export type IMenuProps = {
  items?: MenuProps['items'][number] & {
    render: React.ReactNode
  }
  onSelectMenu?: (type: string) => void
}

export type ISearchListProps<T> = {
  formProps?: Omit<IFormProps<T>, 'configNode' | 'listStore'>
  listProps?: Omit<IListProps, 'listStore'>
  listStore: IListProps['listStore']
  children?: React.ReactNode
  centerChildren?: React.ReactNode
  isPagination?: boolean
  menuProps?: IMenuProps
  showPaginateMode?: boolean
}

const SearchList = <T extends object>({
  listStore,
  formProps,
  listProps,
  children,
  centerChildren,
  isPagination,
  menuProps,
  showPaginateMode,
}: ISearchListProps<T>) => {
  const [curMenu, setCurMenu] = useState<string>('default')
  const [items, setItems] = useState<IMenuProps['items']>([])
  const { loadMoreData, resetData } = listStore
  const { onSelectMenu, ...props } = menuProps || {}

  useEffect(() => {
    setTimeout(() => {
      loadMoreData()
    }, 10)
    return () => {
      resetData()
    }
  }, [])

  useEffect(() => {
    setItems([
      {
        label: '默认',
        key: 'default',
      },
      ...(menuProps?.items || []),
    ])
  }, [menuProps?.items])

  const onHandleSelectMenu: MenuProps['onClick'] = (e) => {
    setCurMenu(e.key)
    onSelectMenu?.(e.key)
  }

  const curRender = useMemo(() => items.find((item: any) => Object.is(item?.key, curMenu))?.render, [curMenu])

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <Layout.Content className={styles.searchContent}>
        {formProps?.formItems && <FormBox {...formProps} listStore={listStore} configNode={children} />}
        {centerChildren}
        <Space className="flex jc-between">
          <div className="flex-g-1">
            {!!menuProps?.items?.length && (
              <Menu
                style={{ border: 'none' }}
                mode="horizontal"
                {...props}
                items={items}
                selectedKeys={[curMenu]}
                onClick={onHandleSelectMenu}
              />
            )}
          </div>
          <Space>
            {showPaginateMode && (
              <Checkbox
                checked={listStore.paginateMode === 'page'}
                onChange={(e) => {
                  const v = e.target.checked
                  listStore.paginateMode = v ? 'page' : 'cursor'
                  listStore.resetData(false)
                  listStore.loadMoreData()
                }}
              >
                开启分页查询
              </Checkbox>
            )}
            {isPagination && listStore.paginateMode === 'page' && listStore.page.total > 0 && (
              <Pagination
                showSizeChanger={false}
                current={listStore.page.page}
                onChange={listStore.onChangePage}
                pageSize={listStore.page.size}
                total={listStore.page.total}
              />
            )}
            {isPagination && listStore.paginateMode === 'cursor' && (
              <CursorPagination
                prevDisabled={listStore.page.page <= 1}
                nextDisabled={!listStore.hasMore}
                onPrev={() => {
                  listStore.onCursorPrev()
                }}
                onNext={() => {
                  listStore.onCursorNext()
                }}
              />
            )}
          </Space>
        </Space>
      </Layout.Content>
      {Object.is(curMenu, 'default') ? (
        <ListBox listStore={listStore} {...listProps} />
      ) : (
        <div style={{ height: '100%' }}>{curRender}</div>
      )}
    </div>
  )
}

export default observer(SearchList)
