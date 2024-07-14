import Page from '@src/components/Page'
import { Layout } from 'antd'
import styles from './style.scss'
import { auth } from '@src/services/api'
import { useEffect } from 'react'
import useRootStore from '@src/stores/useRootStore'

const { Content } = Layout

const Site = () => {
  const { socketStore } = useRootStore()
  useEffect(() => {
    socketStore.initScoket()
  }, [])

  const getUserListReq = async () => {
    const { result } = await auth.getUserList({})
    console.log(result, 'data')
  }
  return (
    <Page title="首页" className={styles.siteBox}>
      <Content className={styles.siteLayout} style={{ padding: '24px 50px' }}>
        首页
        <div onClick={getUserListReq}>获取用户数据</div>
      </Content>
    </Page>
  )
}

export default Site
