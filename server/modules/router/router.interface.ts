import { UserInfo } from '@app/decorators/params.decorator'

export interface PageInfo {
  userInfo?: Omit<UserInfo, 'account'> & {
    name: string
  }
  apiHost?: string
}
