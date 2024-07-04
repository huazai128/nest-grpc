import Page from '@src/components/Page'
import { Layout } from 'antd'
import styles from './style.scss'

const { Content } = Layout

const DataVerview = () => {
  return (
    <Page title="数据汇总" className={styles.siteBox}>
      <Content className={styles.siteLayout} style={{ padding: '24px 50px' }}>
        数据汇总
      </Content>
    </Page>
  )
}

export default DataVerview
