import { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import { RouterCompProps, SwitchRouterProps } from '@src/types'
import routes, { asyncRouteComponents, RouteCompont } from '@src/routes'
import { ConfigProvider, Layout } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { IMenu } from '@src/interfaces/router.interface'
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

const RouteItem = (props: IMenu<RouteCompont>) => {
  if (!props?.component) return null
  const Compnent = asyncRouteComponents[props.component]
  return (
    <Route
      path={props.path}
      loader={() => {
        return ''
      }}
      action={() => {
        return ''
      }}
      element={<Compnent />}
    />
  )
}

interface RenderRoutesProps {
  routeList?: Array<IMenu<RouteCompont>>
}

const RenderRoutes = ({ routeList }: RenderRoutesProps) => {
  return (
    <Routes>
      {routeList?.map((item) =>
        item.children ? (
          <RenderRoutes key={item.path} routeList={item.children} />
        ) : (
          <RouteItem key={item.path} {...item} />
        ),
      )}
    </Routes>
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
        <Routes>
          <RenderRoutes routeList={routes} />
        </Routes>
      </Layout>
    </Layout>
  )
}
