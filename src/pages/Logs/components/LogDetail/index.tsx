import React from 'react'
import { List, Space, Typography, Tooltip, Tag } from 'antd'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'
import dayjs from 'dayjs'
import styles from './style.scss'
import { isObject, isString } from 'lodash'
import { LogItem } from '@src/interfaces/log.interface'
import { MetricsName } from '@src/monitor/interfaces/util.interface'
import { TransportCategory } from '@src/interfaces/monitor.interface'

const keys = ['create_at', 'update_at']
const excludeKeys = ['events', 'stackTrace', 'resourcePrefs', 'breadcrumbs', 'ua_result']
const pKeys = ['params', 'url', 'method', 'body']

const { Title, Text } = Typography

interface IProps extends LogItem {
  onModalType: (type: string, item: LogItem, title: string) => void
}

const LogDetail = ({ onModalType, ...item }: IProps) => {
  const render = () => {
    if (item.category == TransportCategory.ERROR) {
      return (
        <>
          <Tag color="#108ee9" onClick={() => onModalType('code', item, '查看源码')}>
            查看源码
          </Tag>
          <Tag color="#108ee9" onClick={() => onModalType('record', item, '查看录制')}>
            查看录制
          </Tag>
          <Tag color="#108ee9" onClick={() => onModalType('behavior', item, '查看用户行为')}>
            查看用户行为
          </Tag>
        </>
      )
    } else {
      switch (item.reportsType) {
        case MetricsName.FP:
          return (
            <Tag color="#108ee9" onClick={() => onModalType(MetricsName.FP, item, 'FP分析')}>
              FP分析
            </Tag>
          )
        case MetricsName.NT:
          return (
            <Tag color="#108ee9" onClick={() => onModalType(MetricsName.NT, item, 'NT分析')}>
              NT分析
            </Tag>
          )
        case MetricsName.FMP:
          return (
            <Tag color="#108ee9" onClick={() => onModalType(MetricsName.FMP, item, 'FMP分析')}>
              FMP分析
            </Tag>
          )
        case MetricsName.FCP:
          return (
            <Tag color="#108ee9" onClick={() => onModalType(MetricsName.FCP, item, 'FCP分析')}>
              FCP分析
            </Tag>
          )
        case MetricsName.RF:
          return (
            <Tag color="#108ee9" onClick={() => onModalType(MetricsName.RF, item, 'RF分析')}>
              RF分析
            </Tag>
          )
      }
    }
  }
  const uaResult = isString(item?.ua_result) ? JSON.parse(item?.ua_result) : item?.ua_result
  return (
    <List.Item key={item.id}>
      <Space className={styles.logItem}>
        <Text className={styles.logTime}>
          {item.idx}
          <Title level={5}>{dayjs(item.create_at).format('YYYY-MM-DD HH:mm:ss')}</Title>
        </Text>
        <Space direction="vertical">
          <Space className={styles.tagList} size={[0, 8]} wrap>
            <Tooltip title="复制">
              <Text style={{ marginRight: '8px' }}>复制</Text>
            </Tooltip>
            <Tag color="#108ee9" onClick={() => onModalType('ip', item, 'IP分析')}>
              IP: {item.ip} 分析
            </Tag>
            <Tooltip
              overlay={
                <div className={styles.uaResult}>
                  <p>浏览器: {uaResult?.browser?.name}</p>
                  <p>操作系统: {uaResult?.os?.name}</p>
                  <p>操作系统版本: {uaResult?.os?.version}</p>
                  <p>浏览器版本: {uaResult?.engine?.version}</p>
                  <p>引擎: {uaResult?.engine?.name}</p>
                  <p>UA: {uaResult?.ua}</p>
                </div>
              }
            >
              <Tag color="#108ee9">UA分析</Tag>
            </Tooltip>
            {render()}
          </Space>
          {isObject(item) &&
            Object.entries(item).map(
              ([key, value]: any) =>
                !!value &&
                !excludeKeys.includes(key) && (
                  <Text className={styles.logInfo} key={key}>
                    <Tag>{key}:</Tag>
                    {isObject(value)
                      ? JSON.stringify(value)
                      : keys.includes(key)
                        ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
                        : value || ''}
                  </Text>
                ),
            )}
          {item?.requestTime && item.responseTime && (
            <Text className={styles.logInfo}>
              <Tag>接口耗时:</Tag>
              {item.responseTime - item.requestTime}
            </Text>
          )}
          {item.category === 'error' &&
            Object.entries(item).map(
              ([key, value]) =>
                pKeys.includes(key) &&
                value && (
                  <Text className={styles.logInfo} key={key}>
                    <Tag>{key}:</Tag>
                    {isObject(value) ? JSON.stringify(value) : keys.includes(key)}
                  </Text>
                ),
            )}
        </Space>
      </Space>
    </List.Item>
  )
}

export default ErrorBoundaryHoc(LogDetail, 'LogDetail')
