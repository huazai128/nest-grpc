/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo, Fragment } from 'react'
import { Checkbox, Divider, Empty, Select, SelectProps } from 'antd'
import { useSelectStore } from './SelectContext'
import { observer } from 'mobx-react-lite'
import { IValue, SelectOptionType, SelectValue } from './store'
import debounce from 'lodash/debounce'
import classNames from 'classnames'
import { toJS } from 'mobx'
import styles from './style.scss'

interface IProps {
  onSelectChange?: RcSelectProps['onChange']
  mode: RcSelectProps['mode']
}

const SelectAll = observer(({ onSelectChange, mode }: IProps) => {
  const { selectList, values, isSelectAll, handleSelectAll } = useSelectStore()
  const onCheckChange = (e: any) => {
    const res = handleSelectAll(e.target.checked, mode)
    onSelectChange?.(res.value, res.data)
  }
  const list = (toJS(values) || []) as unknown as Array<IValue>
  return (
    <Fragment>
      <Checkbox
        indeterminate={selectList.length !== list?.length && !!list?.length}
        checked={isSelectAll}
        style={{ margin: '0 8px' }}
        onChange={onCheckChange}
      >
        全选
      </Checkbox>
      <Divider style={{ margin: '8px 0' }} />
    </Fragment>
  )
})

export interface RcSelectProps extends SelectProps {
  onChange?: (value?: SelectValue['value'], data?: any) => void
  width?: string
  className?: string
  showSelectAll?: boolean
  topNode?: React.ReactNode
  btmNode?: React.ReactNode
}

export const SelectBox = observer((props: RcSelectProps) => {
  const { onChange, mode, value, placeholder, width, className, showSelectAll, topNode, btmNode, ...otherPorps } =
    props
  const {
    selectList,
    isLoading,
    isSearch,
    values,
    onPopupScroll,
    onSearch,
    onBlur,
    onHandleChange,
    onDeselect,
    onHandleClear,
  } = useSelectStore()

  const onSelectChange = (value: any) => {
    const res = onHandleChange(value, mode)
    onChange?.(res.value, res.data)
  }

  const onHandleDeselect = (value: any) => {
    const res = onDeselect(value, mode)
    onChange?.(res.value, res.data)
  }

  const onClear = () => {
    onHandleClear()
    onChange?.()
  }

  const cls = useMemo(() => classNames(styles['rc-select-box'], className), [className])

  return (
    <Select
      {...otherPorps}
      dropdownRender={(menu) => {
        return (
          <Fragment>
            {showSelectAll && !isSearch && !!mode ? <SelectAll onSelectChange={onChange} mode={mode} /> : topNode}
            {menu}
            {btmNode}
          </Fragment>
        )
      }}
      mode={mode}
      value={toJS(values)}
      placeholder={placeholder || '请选择'}
      labelInValue
      className={cls}
      loading={isLoading}
      notFoundContent={
        !isLoading && !selectList.length ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={isSearch ? '没有搜索你想要的数据' : '暂无数据'} />
        ) : null
      }
      filterOption={false}
      style={{ width: width || '200px' }}
      onPopupScroll={onPopupScroll}
      onSearch={debounce(onSearch, 500)}
      onBlur={onBlur}
      onSelect={onSelectChange}
      onClear={onClear}
      onDropdownVisibleChange={(value) => {
        if (!value) onBlur()
      }}
      onDeselect={onHandleDeselect}
    >
      {selectList?.map((item: SelectOptionType) => (
        <Select.Option key={item.id} value={item.id}>
          {item.name}
        </Select.Option>
      ))}
    </Select>
  )
})
