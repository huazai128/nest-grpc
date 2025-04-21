import { SuspenseProps } from 'react'

export interface SwitchRouterProps {
  onChange?: () => void
}

export interface RouterCompProps extends SwitchRouterProps {
  fallback?: SuspenseProps['fallback']
}
