import { lazy } from 'react'
import { IMenu } from '@src/interfaces/router.interface'
import { AppstoreOutlined, MailOutlined } from '@ant-design/icons'

export const asyncRouteComponents = {
  Site: lazy(() => import(/* webpackChunkName: "Site" */ '@src/pages/Site')),
  Login: lazy(() => import(/* webpackChunkName: "Login" */ '@src/pages/Login')),
}

export type RouteCompont = keyof typeof asyncRouteComponents

const routes: Array<IMenu<RouteCompont>> = [
  {
    path: '/login',
    component: 'Login',
    title: '登录',
  },
  
  // 如果这里放在前面，就会拦截admin相关的路由，所以这种路由都要放在最后
  {
    path: '/home',
    component: 'Site',
    title: '首页',
  },
  
]

export const menus: Array<IMenu<RouteCompont>> = [
  
]

const flatRouter = (list: Array<IMenu<RouteCompont>>): Array<Omit<IMenu<RouteCompont>, 'children'>> => {
  return list.reduce((items, { children, ...item }: any) => {
    const data = Array.isArray(children) ? [item, ...flatRouter(children)] : item
    return items.concat(data)
  }, [])
}

export const routesFlat = flatRouter(menus)

export default routes
