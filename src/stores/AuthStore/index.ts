import { action, makeObservable, observable } from 'mobx'
import { StoreExt } from '@src/utils/reactExt'
export class AuthStore extends StoreExt {
  constructor() {
    super()
    makeObservable(this)
    if (window.INIT_DATA?.userInfo) {
      this.userInfo = window.INIT_DATA?.userInfo
    }
  }

  // 获取用户信息
  @observable userInfo!: IAuthStore.UserInfo

  /**
   * 登录信息
   * @param {Record<string, string>} data
   * @param {() => void} cb
   * @memberof AuthStore
   */
  @action
  login = async (data: Record<string, string>, cb: () => void) => {
    const res = await this.api.auth.login<IAuthStore.UserInfo>({ ...data })
    if (res.status === 'success') {
      this.$message.success('登录成功')
      cb()
    } else {
      this.$message.error(res.message)
    }
  }
}

export default new AuthStore()
