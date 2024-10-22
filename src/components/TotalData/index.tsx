import { Space, Typography } from 'antd'
import styles from './style.scss'
import ErrorBoundaryHoc from '../ErrorBoundary'

interface IProps {
  total: number
}

const TotalData = ({ total }: IProps) => {
  return (
    <Space className={styles.totalData}>
      <Typography.Text>{total || 0}条数据</Typography.Text>
    </Space>
  )
}

export default ErrorBoundaryHoc(TotalData, 'TotalData')
