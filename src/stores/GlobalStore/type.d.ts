import { MechanismType } from '@src/interfaces/log.interface'
import { GlobalStore as GlobalStoreModel } from './index'

export as namespace IGlobalStore

export type GlobalStore = GlobalStoreModel

export type SideBarTheme = 'dark' | 'light'

export interface CategoryItem {
  label: string
  value: string
}

export interface ErrorTypeItem {
  label: string
  value: MechanismType
}
