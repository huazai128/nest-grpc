import Page from '@src/components/Page'
import { Layout } from 'antd'
import styles from './style.scss'

const { Content } = Layout

const Site = () => {
  return (
    <Page title="首页" className={styles.siteBox}>
      <Content className={styles.siteLayout} style={{ padding: '24px 50px' }}>
        首页
      </Content>
    </Page>
  )
}

export default Site
