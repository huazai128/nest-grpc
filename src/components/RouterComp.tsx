import { useEffect, Suspense, Fragment } from 'react'
import { BrowserRouter as Router, Route, Switch, useLocation } from 'react-router-dom'
import { RouterCompProps, SwitchRouterProps } from '@src/types'
import routes, { asyncRouteComponents } from '@src/routes'
import { ConfigProvider, Layout } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

export default function RouterComp(props: RouterCompProps) {
  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={props?.fallback ?? null}>
        <Router>
          <SwitchRouter routes={routes} onChange={props?.onChange} />
        </Router>
      </Suspense>
    </ConfigProvider>
  )
}

export const SwitchRouter = ({ routes, onChange }: SwitchRouterProps) => {
  const location = useLocation()
  useEffect(() => {
    onChange?.()
  }, [location, onChange])
  return (
    <Layout className="site-layout">
      <Layout className="site-content">
        <Switch>
          {routes?.map((m, index) => {
            if (!m?.component) return null
            return <Route key={index} exact={m.exact} path={m.path} component={asyncRouteComponents[m.component]} />
          })}
        </Switch>
      </Layout>
    </Layout>
  )
}
