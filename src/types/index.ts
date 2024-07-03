import { SuspenseProps } from 'react'
import { RouteCompont } from '@src/routes'
import { IMenu } from '@src/interfaces/router.interface'

export interface SwitchRouterProps {
  routes?: Array<IMenu<RouteCompont>>
  onChange?: () => void
}

export interface RouterCompProps extends SwitchRouterProps {
  fallback?: SuspenseProps['fallback']
}
