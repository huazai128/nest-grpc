import React, { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { menus, RouteCompont, routesFlat } from '@src/routes'
import { IMenu } from '@src/interfaces/router.interface'
import useRootStore from '@src/stores/useRootStore'
import { observer } from 'mobx-react-lite'
import { History } from 'history'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import styles from './style.scss'

type MenuItem = Required<MenuProps>['items'][number]

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  theme?: 'light' | 'dark',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    theme,
  } as MenuItem
}

export interface IProps {
  sideBarCollapsed: boolean
  sideBarTheme: IGlobalStore.SideBarTheme
  navOpenKeys: string[]
  setOpenKeys: (openKeys: string[]) => void
  history: History
  siteId: string
  selectedKeys: string[]
}

const loopItem = (item: IMenu<RouteCompont>): MenuItem => {
  const list = item.children?.map(loopItem) as MenuItem[]
  return getItem(item.title, item.key, item.icon, list)
}

const items: MenuItem[] = menus.map(loopItem)

const SiderMenu: React.FC = () => {
  const { globalStore } = useRootStore()
  const { sideBarTheme, selectedKeys, menuProps, onSelected, updateSelectKey } = globalStore
  const location = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    updateSelectKey(location.pathname)
  }, [])

  const goPage: MenuProps['onClick'] = (e) => {
    if (id) {
      const key = e.key
      const path = routesFlat.find((item) => item.key === key)?.path
      const url = path?.replace(':id', id)
      url && navigate('/page/' + url)
    }
  }

  return (
    <Menu
      className={styles.menu}
      theme={sideBarTheme}
      mode="inline"
      onClick={goPage}
      items={items}
      selectedKeys={selectedKeys}
      onSelect={onSelected}
      {...menuProps}
    ></Menu>
  )
}

export default observer(SiderMenu)
