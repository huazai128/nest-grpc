import { createContext, useContext } from 'react'

const PageContext = createContext<any>(null)

interface PageNode {
  children: React.ReactNode
}

interface IProps<T> extends PageNode {
  store: T
}

const PageProvider = <T,>({ children, store }: IProps<T>) => {
  return <PageContext.Provider value={store}>{children}</PageContext.Provider>
}

const usePageStore = () => {
  return useContext(PageContext)
}

export { PageProvider, usePageStore, PageNode }
