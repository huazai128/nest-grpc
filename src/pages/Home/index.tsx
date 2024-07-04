import { Suspense } from 'react'
import { BrowserRouter as Router, Switch, Route, useLocation, useHistory, RouteProps } from 'react-router-dom'
import { asyncRouteComponents, routesFlat } from '@src/routes'
import { Layout } from 'antd'
import Sider from './Sider'
import styles from './index.scss'

const { Content } = Layout

const Home = () => {
  const location = useLocation()
  const history = useHistory()

  const goHome = () => {
    history.push('/')
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
                <Router key={location.pathname}>
                  <Switch>
                    {routesFlat.map((m) => {
                      if (!m.component) return null
                      return (
                        <Route
                          key={m.key}
                          exact={m.exact}
                          path={m.path}
                          component={asyncRouteComponents[m.component] as RouteProps['component']}
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
