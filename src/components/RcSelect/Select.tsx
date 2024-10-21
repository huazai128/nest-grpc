import React, { useMemo, Fragment, useEffect, useRef } from 'react'
import { Checkbox, Divider, Empty, Popover, Select, SelectProps, Space, Tag, Typography } from 'antd'
import { useSelectStore } from './SelectContext'
import { observer } from 'mobx-react-lite'
import { IValue, SelectOptionType, SelectValue, SelectCommonStore } from './store'
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import debounce from 'lodash/debounce'
import classNames from 'classnames'
import { runInAction, toJS } from 'mobx'
import { QuestionCircleOutlined } from '@ant-design/icons'
import './style.scss'

interface IProps {
  onSelectChange?: RcSelectProps['onChange']
  mode: RcSelectProps['mode']
}

const SelectAll = observer(({ onSelectChange, mode }: IProps) => {
  const loadRef = useRef<boolean>(false)
  const {
    isSearch,
    selectList,
    values,
    isSelectAll,
    isDefaultSelectAll,
    allSelectPage,
    deselectValus,
    isSearchAll,
    showSelectAll,
    indeterminateBoo,
    isLoading,
    allLoading,
    handleSelectAll,
    updateDefaultType,
  } = useSelectStore()

  useEffect(() => {
    const getInit = async () => {
      if (isDefaultSelectAll) {
        updateDefaultType()
        const res = await handleSelectAll(true, mode)
        onSelectChange?.(res.value, res.data)
      }
    }
    getInit()
  }, [mode])

  useEffect(() => {
    if (allSelectPage >= 1 && isSelectAll && !deselectValus.length) {
      setTimeout(async () => {
        const res = await handleSelectAll(true, mode)
        onSelectChange?.(res.value, res.data)
      }, 60)
    }
  }, [allSelectPage, isSelectAll])

  const onCheckChange = async (e: any) => {
    if (loadRef.current) return
    loadRef.current = true
    const v = e.target.checked
    const checked = !isSearch && !isSelectAll && !!vIdList.length && !v ? true : v
    const res = await handleSelectAll(checked, mode)
    onSelectChange?.(res.value, res.data)
    setTimeout(() => {
      loadRef.current = false
    }, 60)
  }
  const list = (toJS(values) || []) as unknown as Array<IValue>
  const vIdList = list.map((item) => item.value)
  const sIdList = toJS(selectList).map((item) => item.id)
  return (
    <Fragment>
      <Space
        align="end"
        style={{ width: '100%', padding: '0 4px 0 16px', display: 'flex', justifyContent: 'space-between' }}
      >
        <Typography.Text>全选</Typography.Text>
        <Checkbox
          disabled={(isSearch && isLoading && showSelectAll) || allLoading || !sIdList.length}
          indeterminate={
            isSearch
              ? indeterminateBoo
              : (!isSelectAll && !!vIdList.length) || (isSelectAll && !!toJS(deselectValus).length)
          }
          checked={isSearch ? isSearchAll : (isSelectAll && !toJS(deselectValus).length) || isSearchAll}
          style={{ margin: '0 8px' }}
          onChange={onCheckChange}
        ></Checkbox>
      </Space>
      <Divider style={{ margin: '8px 0' }} />
    </Fragment>
  )
})

const tagRender = ({
  deselectValus,
  isSelectAll,
  len,
}: Pick<SelectCommonStore, 'deselectValus' | 'isSelectAll'> & { len: number }) => {
  return (props: CustomTagProps) => {
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()
    }
    return (
      <Tag onMouseDown={onPreventMouseDown} key={isSelectAll ? 'key' : props.value}>
        <span style={{ display: 'inline-block', marginRight: '2px' }}>已选中 {len} 项</span>
        {!!deselectValus?.length && (
          <Popover
            placement="top"
            content={<div>{deselectValus?.map((item) => <p key={item.value}>{item.label}</p>)}</div>}
            title="已排除选项"
            trigger="hover"
          >
            <QuestionCircleOutlined />
          </Popover>
        )}
      </Tag>
    )
  }
}

export interface RcSelectProps extends SelectProps {
  onChange?: (value?: SelectValue['value'], data?: any) => void
  width?: string
  className?: string
  showSelectAll?: boolean
  topNode?: React.ReactNode
  btmNode?: React.ReactNode
  selectAllType?: 'all' | 'once'
  defaultData?: SelectOptionType
  isShowId?: boolean
  otherParams?: Record<string, any>
  renderItem?: (item: SelectOptionType) => React.ReactNode
  groupList?: string[]
  changeData?: (list?: Array<any>) => void
}

export const SelectBox = observer((props: RcSelectProps) => {
  const onceRef = useRef<boolean>(false)
  const {
    onChange,
    mode,
    value,
    placeholder,
    width,
    className,
    showSelectAll,
    topNode,
    btmNode,
    selectAllType = 'all',
    defaultData,
    style = {},
    isShowId,
    maxTagCount,
    onDropdownVisibleChange,
    changeData,
    otherParams = {},
    renderItem,
    filterOption,
    groupList,
    ...otherPorps
  } = props
  const store = useSelectStore()
  const {
    selectList,
    isLoading,
    isSearch,
    values,
    isSelectAll,
    deselectValus,
    total,
    isEdit,
    allLoading,
    onPopupScroll,
    onSearch,
    onBlur,
    onHandleChange,
    onDeselect,
    updateSelectType,
    handleSelectAll,
    updateExcludeList,
    onClearData,
  } = store

  useEffect(() => {
    updateSelectType(!!showSelectAll)
  }, [showSelectAll])

  useEffect(() => {
    if (!onceRef.current && !!toJS(selectList).length) {
      onceRef.current = false
      changeData?.(toJS(selectList))
    }
  }, [!!toJS(selectList)?.length])

  useEffect(() => {
    // 全选回填问题
    if ((value === true || value?.value === true) && (mode == 'multiple' || mode == 'tags')) {
      if (selectList.length) {
        updateExcludeList(value?.excludeList || [])
        setTimeout(async () => {
          const res = await handleSelectAll(true, mode, false)
          onChange?.(res.value, res.data)
        }, 300)
      }
    }
  }, [value, value?.excludeList, selectList.length])

  useEffect(() => {
    store.userOtherParams = { ...otherParams }
  }, [otherParams])

  useEffect(() => {
    if (defaultData) {
      runInAction(() => {
        store.defaultData = defaultData
      })
    }
  }, [defaultData])

  const onSelectChange = (value: any) => {
    const nValue = Array.isArray(value?.label) ? { ...value, label: value.label[0] } : value
    const res = onHandleChange(nValue, mode)
    onChange?.(res.value, res.data)
  }

  const onHandleDeselect = (value: any) => {
    if (isEdit) {
      return
    }
    const res = onDeselect(value, mode)
    onChange?.(res.value, res.data)
  }

  const cls = useMemo(() => classNames('rc-select-box', className), [className])

  let aList: any[] = []
  let groupedData: any = {}
  if (!!groupList?.length) {
    groupedData = toJS(selectList).reduce((result, item) => {
      if (item?.expand && groupList.includes(item?.expand)) {
        if (!result[item?.expand]) {
          result[item?.expand] = []
        }
        result[item?.expand].push(item)
      } else {
        aList.push(item)
      }
      return result
    }, {} as any)
  } else {
    aList = toJS(selectList)
  }

  const onHandleClear = () => {
    onClearData()
    onChange?.(undefined, undefined)
  }

  return (
    <Select
      {...otherPorps}
      dropdownRender={(menu) => {
        return (
          <Fragment>
            {showSelectAll && !!mode ? <SelectAll onSelectChange={onChange} mode={mode} /> : topNode}
            {menu}
            {btmNode}
          </Fragment>
        )
      }}
      tagRender={
        !!mode && isSelectAll && Object.is(selectAllType, 'once')
          ? tagRender({ isSelectAll, deselectValus, len: total })
          : undefined
      }
      maxTagCount={!!mode && isSelectAll && Object.is(selectAllType, 'once') ? 1 : maxTagCount || undefined}
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
      filterOption={filterOption || false}
      style={{ width: width || '200px', ...style }}
      onPopupScroll={onPopupScroll}
      onSearch={debounce(onSearch, 500)}
      onBlur={onBlur}
      onSelect={onSelectChange}
      onDropdownVisibleChange={(value) => {
        onDropdownVisibleChange?.(value)
        if (!value) onBlur()
      }}
      onDeselect={onHandleDeselect}
      onClear={onHandleClear}
    >
      {aList?.map((item: SelectOptionType) =>
        !!renderItem ? (
          renderItem(item)
        ) : (
          <Select.Option
            key={item.id}
            disabled={(isSearch && isLoading && showSelectAll) || allLoading}
            value={item.id}
            label={item.name}
          >
            {item.name} {isShowId && !!item.id && <Typography.Text type="secondary"> ({item.id})</Typography.Text>}
          </Select.Option>
        ),
      )}
      {!!groupList?.length &&
        groupList.map((item) => {
          const list = groupedData[item]
          if (!list?.length) return null
          return (
            <Select.OptGroup label={item} key={item}>
              {list?.map((item: any) => (
                <Select.Option
                  key={item.id}
                  disabled={(isSearch && isLoading && showSelectAll) || allLoading}
                  value={item.id}
                  label={item.name}
                >
                  {item.name}
                  {isShowId && !!item.id && <Typography.Text type="secondary"> ({item.id})</Typography.Text>}
                </Select.Option>
              ))}
            </Select.OptGroup>
          )
        })}
    </Select>
  )
})
