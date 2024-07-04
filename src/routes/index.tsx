import { lazy } from 'react'
import { IMenu } from '@src/interfaces/router.interface'
import { AppstoreOutlined } from '@ant-design/icons'

export const asyncRouteComponents = {
  Site: lazy(() => import(/* webpackChunkName: "Site" */ '@src/pages/Site')),
  Login: lazy(() => import(/* webpackChunkName: "Login" */ '@src/pages/Login')),
  Home: lazy(() => import(/* webpackChunkName: "Home" */ '@src/pages/Home')),
  DataVerview: lazy(() => import(/* webpackChunkName: "DataVerview" */ '@src/pages/DataVerview')),
}

export type RouteCompont = keyof typeof asyncRouteComponents

const routes: Array<IMenu<RouteCompont>> = [
  {
    path: '/login',
    component: 'Login',
    title: '登录',
  },
  {
    path: '/page/*',
    component: 'Home',
    title: '首页',
  },

  // 如果这里放在前面，就会拦截其他相关的路由，所以这种路由都要放在最后
  {
    path: '/*',
    component: 'Site',
    title: '首页',
  },
]

export const menus: Array<IMenu<RouteCompont>> = [
  {
    path: '/page/home',
    component: 'DataVerview',
    title: '总览',
    icon: <AppstoreOutlined />,
    key: '1', // 子集key: 1-1、1-1-1  隐藏page为11 12 递增
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
