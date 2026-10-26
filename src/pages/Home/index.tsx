import { useEffect, Suspense } from 'react'
import useRootStore from '@src/stores/useRootStore'
import { BrowserRouter as Router, Switch, Route, useLocation, useRouteMatch, useHistory } from 'react-router-dom'
import { asyncRouteComponents, routesFlat } from '@src/routes'
import { Layout, Button } from 'antd'
import Sider from './Sider'
import styles from './index.scss'

const { Content } = Layout

const Home = () => {
  const { globalStore } = useRootStore()
  const location = useLocation()
  const history = useHistory()
  const { params } = useRouteMatch('/admin/:id/*') as { params: any }
  useEffect(() => {
    globalStore.updateSite(params.id)
  }, [location])

  const goHome = () => {
    history.push('/')
  }
  return (
    <>
      <Layout.Header className="site-header">
        <h4 style={{ color: '#fff', fontSize: '16px', cursor: 'pointer' }} onClick={goHome}>
          日志管理系统
        </h4>
      </Layout.Header>
      <Layout className="site-content">
        <Layout>
          <Sider />
          <Layout>
            <Content className={styles.App}>
              <Suspense fallback={null}>
                <Router key={location.pathname}>
                  <Switch>
                    {routesFlat.map((m) => {
                      if (!m.component) return null
                      return (
                        <Route
                          key={m.key}
                          exact={m.exact}
                          path={m.path}
                          component={asyncRouteComponents[m.component]}
                        />
                      )
                    })}
                  </Switch>
                </Router>
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  )
}

export default Home
