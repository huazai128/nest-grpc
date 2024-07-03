import useRootStore from '@src/stores/useRootStore'
import classnames from 'classnames'
import { Layout, Switch } from 'antd'
import { MenuFoldOutlined } from '@ant-design/icons'
import styles from './style.scss'
import { observer } from 'mobx-react-lite'
import SiderMenu from './Menu'

const Sider: React.FC = () => {
  const { sideBarCollapsed, sideBarTheme, changeSiderTheme, toggleSideBarCollapsed } = useRootStore().globalStore

  const ChangeTheme = (
    <div className={classnames(styles.changeTheme, sideBarTheme === 'dark' && styles.dark, 'fs-12')}>
      切换主题
      <Switch
        checkedChildren="dark"
        unCheckedChildren="light"
        checked={sideBarTheme === 'dark'}
        onChange={(val) => changeSiderTheme(val ? 'dark' : 'light')}
      />
    </div>
  )
  return (
    <Layout.Sider
      className={styles.siderBox}
      trigger={null}
      theme={sideBarTheme}
      collapsible
      collapsed={sideBarCollapsed}
    >
      <div className={classnames(styles.logoBox, sideBarTheme === 'dark' && styles.dark)}>
        <MenuFoldOutlined onClick={toggleSideBarCollapsed} />
      </div>
      <SiderMenu />
      {!sideBarCollapsed && ChangeTheme}
    </Layout.Sider>
  )
}

export default observer(Sider)
