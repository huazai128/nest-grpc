import React from 'react'
import { List, ListProps, Spin } from 'antd'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import InfiniteScroll from 'react-infinite-scroll-component'
import { ListStore } from './store'
import classnames from 'classnames'
import styles from './style.scss'

export interface IListProps extends ListProps<any> {
  style?: React.CSSProperties
  isBatchOpt?: boolean
  listStore: ListStore
  renderItem?: ListProps<any>['renderItem']
  isScrollData?: boolean
}

const ListBox = observer(({ style, listStore, isScrollData = true, renderItem, ...props }: IListProps) => {
  const { isLoading, page, isMore, data, loadMoreData } = listStore

  return (
    <div className={styles.listBox}>
      {isLoading && (
        <div className={classnames('flex-center', styles.listSpin)}>
          <Spin></Spin>
        </div>
      )}
      <div
        className={classnames('flex-g-1', styles.listBox, styles.listScroll)}
        id="scrollableDiv"
        style={style || {}}
      >
        <InfiniteScroll
          dataLength={page.total}
          next={() => {
            isScrollData && loadMoreData()
          }}
          hasMore={isMore}
          loader={null}
          scrollableTarget="scrollableDiv"
        >
          <List dataSource={toJS(data)} renderItem={renderItem} {...props} />
        </InfiniteScroll>
      </div>
    </div>
  )
})

export default ListBox
