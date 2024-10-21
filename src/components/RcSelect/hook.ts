import { toJS } from 'mobx'
import { useEffect } from 'react'
import { RcSelectProps, useSelectStore } from '.'

export const useChangeKeyUpdate = <T extends object>(deps: T) => {
  const { onUpdateParmas, clearData } = useSelectStore()
  useEffect(() => {
    clearData()
    onUpdateParmas({ ...deps })
  }, [JSON.stringify(deps)])
}

export const useValueChange = <T extends object>({ mode, value }: Pick<RcSelectProps, 'mode' | 'value'>, deps: T) => {
  const { values, handleValueData } = useSelectStore()
  useEffect(() => {
    const isData = Array.isArray(value) ? !!value?.length : !!value || value == 0
    const nVlaue = Array.isArray(values) ? values[0]?.value : values?.value
    const v = toJS(values)
    if ((isData && !v) || (!mode && !!nVlaue && value !== nVlaue)) {
      handleValueData(value, mode)
    }
  }, [mode, JSON.stringify(value), JSON.stringify(values), JSON.stringify(deps)])
}
