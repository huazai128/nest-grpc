import { Divider, Space, Typography } from 'antd'
import { Fragment } from 'react'
import styles from './style.scss'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'

const { Text } = Typography

interface IProps {
  list: Array<any>
  stackTrace: Array<any>
}

const ErrorCode = ({ list, stackTrace }: IProps) => {
  return (
    <Space className={styles.errorCode} style={{ width: '100%' }} split={<Divider type="vertical" />}>
      {list?.map(({ context, originLine, source }, index) => (
        <Space key={index}>
          <Space direction="vertical">
            {context ? (
              <Fragment>
                <Text>错误文件：{source}</Text>
                <Text>错误行数：{originLine}</Text>
                <Text>
                  错误代码：
                  <pre>
                    <code>{context}</code>
                  </pre>
                </Text>
              </Fragment>
            ) : (
              '暂无错误代码'
            )}
          </Space>
          <Space direction="vertical">
            <Typography.Title level={5}>错误文件：</Typography.Title>
            {stackTrace?.map((item, index) => <Typography.Text key={index}>{JSON.stringify(item)}</Typography.Text>)}
          </Space>
        </Space>
      ))}
    </Space>
  )
}

export default ErrorBoundaryHoc(ErrorCode, 'ErrorCode')
