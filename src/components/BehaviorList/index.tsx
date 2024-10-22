import React from 'react'
import { Timeline, Typography } from 'antd'
import { TransportCategory } from '@src/types'
import ErrorBoundaryHoc from '../ErrorBoundary'
import { formatResponse, formatStr } from '@src/utils/util'

const { Link, Text } = Typography

const PvItem = ({ path }: { path: string }) => {
  return (
    <>
      <Link>进入页面:</Link>
      <Text>PV上报</Text>
      <Text>路由:{path || '无'} </Text>
    </>
  )
}
const EventItem = ({ nodeDom }: { nodeDom: string }) => {
  return (
    <>
      <Link>点击行为：</Link>
      <Text>{nodeDom}</Text>
    </>
  )
}

const PrefItem = () => {
  return (
    <>
      <Link>性能上报行为：</Link>
      <Text>Pref</Text>
    </>
  )
}

const CustomItem = () => {
  return (
    <>
      <Link>自定义上报行为：</Link>
      <Text>Custom</Text>
    </>
  )
}

const ApiItem = ({ url, body, params, response }: any) => {
  return (
    <div className="behavior-list-api-item">
      <span className="behavior-list-api-item-title">
        <Link>自定义上报行为：</Link>
        <Text>接口：{url}</Text>
      </span>
      <span className="behavior-list-api-item-content">
        <Text>Body参数：{formatStr(params)}</Text>
        <Text>URL参数：{formatStr(body)}</Text>
        <Text>返回：{formatResponse(response)}</Text>
      </span>
    </div>
  )
}

const ErrorItem = ({ value }: any) => {
  return (
    <>
      <Link>错误信息：</Link>
      <Text>{value} </Text>
    </>
  )
}

const renderItem = (item: any) => {
  const render = () => {
    switch (item.category) {
      case TransportCategory.PV:
        return <PvItem path={item.path} />
      case TransportCategory.EVENT:
        return <EventItem nodeDom={item.nodeDom} />
      case TransportCategory.PREF:
        return <PrefItem />
      case TransportCategory.CUSTOM:
        return <CustomItem />
      case TransportCategory.API:
        return <ApiItem {...item} />
      case TransportCategory.ERROR:
        return <ErrorItem value={item.value} />
    }
  }
  return render()
}
interface IProps {
  list: Array<any>
}

const BehaviorList = ({ list }: IProps) => {
  return !!list.length ? (
    <Timeline>
      {!!list?.length &&
        list.map((item, index) => (
          <Timeline.Item key={index} color={item.category === 'error' ? 'red' : 'green'}>
            {renderItem(item)}
          </Timeline.Item>
        ))}
    </Timeline>
  ) : (
    <Text>无用户行为数据</Text>
  )
}

export default ErrorBoundaryHoc(BehaviorList, 'BehaviorList')
