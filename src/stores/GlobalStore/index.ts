import { StoreExt } from '@src/utils/reactExt'
import { action, observable, makeObservable, computed, toJS } from 'mobx'
import * as STORE_KEY from '@src/constants/storeKey.constant'
import { MenuProps } from 'antd'

export class GlobalStore extends StoreExt {
  constructor() {
    super()
    makeObservable(this)
  }

  private curTheme = localStorage.getItem(STORE_KEY.SIDE_BAR_THEME) as IGlobalStore.SideBarTheme

  private keys = localStorage.getItem(STORE_KEY.SELECTED_KEY)

  // 当前站点ID
  @observable siteId!: string

  // 上报类型数据
  @observable categoryList: Array<IGlobalStore.CategoryItem> = window.INIT_DATA?.categoryList || []

  /**
   * 菜单栏折叠
   * @type {boolean}
   * @memberof GlobalStore
   */
  @observable sideBarCollapsed: boolean = localStorage.getItem(STORE_KEY.SIDE_BAR_COLLAPSED) === '1'

  /**
   * 打开的菜单key
   * @type {string[]}
   * @memberof GlobalStore
   */
  @observable navOpenKeys: string[] = JSON.parse(localStorage.getItem(STORE_KEY.NAV_OPEN_KEYS) || '[]')

  /**
   * 菜单栏主题
   * @type {IGlobalStore.SideBarTheme}
   * @memberof GlobalStore
   */
  @observable sideBarTheme: IGlobalStore.SideBarTheme = this.curTheme || 'light'

  /**
   * 当前选择选择的key
   * @type {string}
   * @memberof GlobalStore
   */
  @observable selectedKeys: string[] = (this.keys && JSON.parse(this.keys)) || ['1-1-1']

  @computed
  get menuProps() {
    const { sideBarCollapsed, navOpenKeys } = this
    return !sideBarCollapsed ? { onOpenChange: this.setOpenKeys, openKeys: navOpenKeys } : {}
  }

  @action
  toggleSideBarCollapsed = () => {
    this.sideBarCollapsed = !this.sideBarCollapsed
    localStorage.setItem(STORE_KEY.SIDE_BAR_COLLAPSED, this.sideBarCollapsed ? '1' : '0')
  }

  @action
  changeSiderTheme = (theme: IGlobalStore.SideBarTheme) => {
    this.sideBarTheme = theme
    localStorage.setItem(STORE_KEY.SIDE_BAR_THEME, theme)
  }

  @action
  setOpenKeys = (openKeys: string[]) => {
    this.navOpenKeys = openKeys
    localStorage.setItem(STORE_KEY.NAV_OPEN_KEYS, JSON.stringify(openKeys))
  }

  @action
  onSelected: MenuProps['onSelect'] = ({ selectedKeys }: any) => {
    this.selectedKeys = selectedKeys
    localStorage.setItem(STORE_KEY.SELECTED_KEY, JSON.stringify(selectedKeys))
  }
}

export default new GlobalStore()
