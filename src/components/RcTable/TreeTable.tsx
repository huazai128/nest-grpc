/* eslint-disable @typescript-eslint/ban-types */
import React, { Component } from 'react'
import { SearchTableProps, SearchTable } from './SearchTable'
import { TreeBox, ITreeProps } from './Tree'

type TreeTablePorps<T> = SearchTableProps<T> & {
  treeProps: ITreeProps
}

export const TreeTable = <T extends object>({ treeProps, children, ...props }: TreeTablePorps<T>) => {
  return (
    <div>
      <TreeBox {...treeProps}></TreeBox>
      <SearchTable<T> {...props}>{children}</SearchTable>
    </div>
  )
}
