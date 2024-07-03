export interface IMenu<T> {
  title: string
  path?: string
  icon?: React.ReactNode
  component?: T
  exact?: boolean
  isHide?: boolean
  children?: Array<IMenu<T>>
  key?: React.Key
}
