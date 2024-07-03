import React, { useContext } from 'react'
import { SelectCommonStore } from './store'

export const SelectContext = React.createContext<SelectCommonStore>({} as any)

export interface IProviderProps {
  store: SelectCommonStore
  children: React.ReactNode
}

const SelectContextProvider = ({ store, children }: IProviderProps) => {
  // 这里触发下拉刷新接口
  return <SelectContext.Provider value={store}>{children}</SelectContext.Provider>
}

const useSelectStore = () => {
  return useContext(SelectContext)
}

export { useSelectStore, SelectContextProvider }
