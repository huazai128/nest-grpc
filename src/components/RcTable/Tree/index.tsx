import React, { useEffect, useCallback } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { Tree, TreeProps } from 'antd'
import { TreeStore } from '..'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { TreeNode } from './store'

export interface ITreeProps extends Omit<TreeProps, 'titleRender'> {
  treeStore: TreeStore
  titleRender?: (data: TreeNode) => React.ReactNode
}

export const TreeBox: React.FC<ITreeProps> = observer(({ treeStore, ...props }: ITreeProps) => {
  const { style = {}, ...otherProps } = props
  const { fetchTreeList, onSelect, onExpand, onChangeView, getLoadData, expandedKeys, selectedKeys } = treeStore

  useEffect(() => {
    const initData = async () => {
      await fetchTreeList()
      setTimeout(() => {
        onChangeView()
      }, 30)
    }
    initData()
  }, [])

  const onLoadData = useCallback(({ key, children }: any) => {
    return new Promise<void>(async (resolve) => {
      if (!!children) {
        resolve()
        return
      }
      await getLoadData(key)
      resolve()
    })
  }, [])

  return (
    <Tree
      {...otherProps}
      style={{ width: '220px', ...style }}
      switcherIcon={<DownOutlined />}
      onSelect={onSelect}
      onExpand={onExpand}
      expandedKeys={toJS(expandedKeys)}
      selectedKeys={toJS(selectedKeys)}
      loadData={onLoadData}
      treeData={toJS(treeStore.treeList)}
    />
  )
})
