import { lazy } from 'react'
import { IMenu } from '@src/interfaces/router.interface'
import { AppstoreOutlined, LineChartOutlined, MailOutlined } from '@ant-design/icons'

export const asyncRouteComponents = {
  Site: lazy(() => import(/* webpackChunkName: "Site" */ '@src/pages/Site')),
  Login: lazy(() => import(/* webpackChunkName: "Login" */ '@src/pages/Login')),
  Home: lazy(() => import(/* webpackChunkName: "Home" */ '@src/pages/Home')),
  DataVerview: lazy(() => import(/* webpackChunkName: "DataVerview" */ '@src/pages/DataVerview')),
  Logs: lazy(() => import(/* webpackChunkName: "Logs" */ '@src/pages/Logs')),
  UserError: lazy(() => import(/* webpackChunkName: "UserError" */ '@src/pages/UserError')),
  ActionDetail: lazy(() => import(/* webpackChunkName: "ActionDetail" */ '@src/pages/ActionDetail')),
  PvData: lazy(() => import(/* webpackChunkName: "Pv" */ '@src/pages/Pv')),
  Terminal: lazy(() => import(/* webpackChunkName: "Terminal" */ '@src/pages/Terminal')),
  Error: lazy(() => import(/* webpackChunkName: "Error" */ '@src/pages/Error')),
  Performance: lazy(() => import(/* webpackChunkName: "Performance" */ '@src/pages/Performance')),
  WhiteScreen: lazy(() => import(/* webpackChunkName: "WhiteScreen" */ '@src/pages/WhiteScreen')),
  Memory: lazy(() => import(/* webpackChunkName: "Memory" */ '@src/pages/Memory')),
  NetworkAnalysis: lazy(() => import(/* webpackChunkName: "NetworkAnalysis" */ '@src/pages/NetworkAnalysis')),
}

export type RouteCompont = keyof typeof asyncRouteComponents

const routes: Array<IMenu<RouteCompont>> = [
  {
    path: '/login',
    component: 'Login',
    title: '登录',
  },
  {
    path: '/admin/*',
    component: 'Home',
    title: '站点',
  },
  // 如果这里放在前面，就会拦截admin相关的路由，所以这种路由都要放在最后
  {
    path: '/site',
    component: 'Site',
    title: '监控门户',
  },
  {
    path: '/action-detail/:id',
    component: 'ActionDetail',
    title: '用户行为详情',
  },
  {
    path: '/*',
    component: 'Site',
    title: '监控门户',
  },
]

export const menus: Array<IMenu<RouteCompont>> = [
  {
    path: '/admin/:id/home',
    component: 'DataVerview',
    title: '应用总览',
    icon: <AppstoreOutlined />,
    key: '1', // 子集key: 1-1、1-1-1  隐藏page为11 12 递增
  },
  {
    path: '/admin/:id/logs',
    component: 'Logs',
    title: '日志详情',
    icon: <MailOutlined />,
    key: '2',
  },
  {
    path: '/admin/:id/user',
    title: '反馈日志',
    icon: <MailOutlined />,
    key: '3',
    component: 'UserError',
  },
  {
    path: '/admin/:id/pv',
    title: '页面分析',
    icon: <MailOutlined />,
    key: '4',
    component: 'PvData',
  },
  {
    path: '/admin/:id/error',
    title: '错误分析',
    icon: <MailOutlined />,
    key: '5',
    component: 'Error',
  },
  {
    path: '/admin/:id/terminal',
    title: '终端分析',
    icon: <MailOutlined />,
    key: '6',
    component: 'Terminal',
  },
  {
    path: '/admin/:id/performance',
    title: '性能分析',
    icon: <MailOutlined />,
    key: '7',
    component: 'Performance',
  },
  {
    path: '/admin/:id/whitescreen',
    title: '白屏分析',
    icon: <MailOutlined />,
    key: '8',
    component: 'WhiteScreen',
  },
  {
    path: '/admin/:id/memory',
    title: '内存',
    icon: <MailOutlined />,
    key: '9',
    component: 'Memory',
  },
  {
    path: '/admin/:id/network',
    title: '网络分析',
    icon: <LineChartOutlined />,
    key: '10',
    component: 'NetworkAnalysis',
  },
]

const flatRouter = (list: Array<IMenu<RouteCompont>>): Array<Omit<IMenu<RouteCompont>, 'children'>> => {
  return list.reduce((items, { children, ...item }: any) => {
    const data = Array.isArray(children) ? [item, ...flatRouter(children)] : item
    return items.concat(data)
  }, [])
}

export const routesFlat = flatRouter(menus)

export default routes
