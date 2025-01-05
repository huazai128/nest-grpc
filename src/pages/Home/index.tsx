import { Suspense, useEffect } from 'react'
import { useNavigate, Outlet, useParams } from 'react-router-dom'
import { Layout } from 'antd'
import Sider from './Sider'
import styles from './index.scss'
import useRootStore from '@src/stores/useRootStore'

const { Content } = Layout

const Home = () => {
  const { globalStore } = useRootStore()
  const navigate = useNavigate()
  const params = useParams() as { id: string }
  useEffect(() => {
    globalStore.updateSite(params.id)
  }, [params.id])

  const goHome = () => {
    navigate('/')
  }
  return (
    <>
      <Layout.Header className="site-header">
        <h4 style={{ color: '#fff', fontSize: '16px', cursor: 'pointer' }} onClick={goHome}>
          管理后台
        </h4>
      </Layout.Header>
      <Layout className="site-content">
        <Layout>
          <Sider />
          <Layout>
            <Content className={styles.App}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default Home
