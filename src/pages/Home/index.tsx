import { Suspense } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { asyncRouteComponents, routesFlat } from '@src/routes'
import { Layout } from 'antd'
import Sider from './Sider'
import styles from './index.scss'

const { Content } = Layout

const Home = () => {
  const navigate = useNavigate()

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
                <Routes>
                  {routesFlat.map((m, index) => {
                    if (!m.component) return null
                    const Compnent = asyncRouteComponents[m.component]
                    return (
                      <Route
                        key={index}
                        path={m.path}
                        loader={({ params }) => {
                          console.log(params, '====')
                          return ''
                        }}
                        action={({ params }) => {
                          console.log(params, '====')
                          return ''
                        }}
                        element={<Compnent />}
                      />
                    )
                  })}
                </Routes>
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default Home
