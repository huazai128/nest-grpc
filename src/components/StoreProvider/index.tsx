import { createContext, ReactElement } from 'react'
import { Observer } from 'mobx-react-lite'
import * as stores from '@src/stores/index'

const StoreContext = createContext<IStore>(null as any)

interface IProps {
  children: React.ReactNode
}

interface ChildrenProps<T> {
  children: (value: T) => ReactElement<any>
}

/**
 * 已包含Observer
 * @param {ChildrenProps<IStore>} { children }
 */
export const RootConsumer = ({ children }: ChildrenProps<IStore>) => <Observer>{() => children(stores)}</Observer>

const Provider = ({ children }: IProps) => {
  return <StoreContext.Provider value={{ ...stores }}>{children}</StoreContext.Provider>
}

export { Provider, StoreContext }
