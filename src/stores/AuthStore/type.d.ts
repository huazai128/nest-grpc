import { AuthStore as AuthStoreModel } from './index'

export as namespace IAuthStore

export type AuthStore = AuthStoreModel

export interface UserInfo {
  userId: number
  name: string
}
