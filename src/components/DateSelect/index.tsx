import React, { useEffect, useRef, Fragment } from 'react'
import { Popover, Space, Menu, Card, Typography, DatePicker, Button } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import ErrorBoundaryHoc from '../ErrorBoundary'
import dayjs, { Dayjs } from 'dayjs'
import { DateInfo, dateList, items } from './data'
import { toJS } from 'mobx'
import classnames from 'classnames'
import styles from './style.scss'
import { DateSelectProvider, useDateStore } from './store'
import { observer } from 'mobx-react-lite'

const { RangePicker } = DatePicker

const { Text } = Typography

const PopoverContent = observer(() => {
  const timeRef = useRef<Array<Dayjs>>([dayjs().startOf('week'), dayjs()])
  const { selectedKeys, times, selectId, onMouseEnter, onChangeMenu, onSelectTime, customTime, onOpenPickerChange } =
    useDateStore()

  const changeTime = (date: any) => {
    date && (timeRef.current = date)
  }

  return (
    <div style={{ width: '360px' }}>
      <Menu
        className={styles.menuBox}
        mode="horizontal"
        onSelect={onChangeMenu}
        selectedKeys={selectedKeys}
        items={items}
      />
      <Card bordered={false} className={styles.menuList}>
        {selectedKeys.includes('1') ? (
          <Fragment>
            <Text style={{ fontSize: '12px', paddingBottom: '5px', display: 'block' }}>
              {`${dayjs(times[0]).format('YYYY-MM-DD HH:mm:ss')}-${dayjs(times[1]).format('YYYY-MM-DD HH:mm:ss')}`}
            </Text>
            <Space size={[8, 5]} wrap className={styles.dateList}>
              {dateList.map((item) => (
                <Text
                  key={item.id}
                  onMouseEnter={() => onMouseEnter(item)}
                  onClick={() => onSelectTime(item)}
                  className={classnames(styles.dateItem, {
                    [styles.select]: selectId == item.id,
                  })}
                >
                  {item.label}
                </Text>
              ))}
            </Space>
          </Fragment>
        ) : (
          <Space>
            <RangePicker onChange={changeTime} onOpenChange={onOpenPickerChange} showTime />
            <Button
              type="primary"
              onClick={() => {
                timeRef.current && customTime(timeRef.current)
                timeRef.current = [dayjs().startOf('week'), dayjs()]
              }}
            >
              确认
            </Button>
          </Space>
        )}
      </Card>
    </div>
  )
})

export interface DateSelectProps {
  value: Array<Dayjs>
  selectInfo?: DateInfo
}
interface IProps {
  onChange?: (data: DateSelectProps) => void
  value?: Array<Dayjs>
}

export interface DateSelectRef {
  onSelectTime: (dateItem: DateInfo) => void
}

const DateSelect = observer(({ onChange }: IProps) => {
  const dateStoreT = useDateStore()
  const { open, selectInfo, selectTime, onOpenChange } = dateStoreT

  useEffect(() => {
    onChange?.({
      value: toJS(selectTime),
      selectInfo: selectInfo as DateInfo,
    })
  }, [selectTime, selectInfo])

  return (
    <Popover
      trigger={['click']}
      placement="bottom"
      open={open}
      overlayClassName="popover"
      onOpenChange={onOpenChange}
      content={<PopoverContent />}
    >
      <Text onClick={(e) => e.preventDefault()} className={styles.dateSelect}>
        <Space>
          {selectInfo?.id
            ? `${selectInfo.label}(相对)`
            : `${dayjs(selectTime[0]).format('YYYY-MM-DD HH:mm:ss')}-${dayjs(selectTime[1]).format(
              'YYYY-MM-DD HH:mm:ss',
            )}`}
          <DownOutlined />
        </Space>
      </Text>
    </Popover>
  )
})

const IDateSelectProvider = (props: IProps) => {
  return (
    <DateSelectProvider>
      <DateSelect {...props} />
    </DateSelectProvider>
  )
}

export default ErrorBoundaryHoc(IDateSelectProvider, 'DateSelect')
