import { AuthInfo } from '@app/interfaces/auth.interface'

export interface PageInfo {
  userInfo?: Omit<AuthInfo, 'account'> & {
    name: string
  }
  apiHost?: string
}
