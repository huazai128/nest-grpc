import React, { useEffect, useMemo, useCallback } from 'react'
import { Form, Space, FormProps, FormItemProps, Button } from 'antd'
import { observer } from 'mobx-react-lite'
import { runInAction } from 'mobx'
import classNames from 'classnames'
import { TableStore } from '..'

export interface IFormProps<T> extends Omit<FormProps, 'style'> {
  formItems?: Array<FormItemProps>
  configNode?: React.ReactNode
  tableStore: TableStore
}

export const FormBox = observer(<T,>({ className, formItems, configNode, tableStore, ...props }: IFormProps<T>) => {
  const form = Form.useForm()[0]

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const event = e || window.event
      const key = event.which || event.keyCode || event.charCode
      if (key == 13) {
        tableStore.getFetchData()
      }
    }
    const initEvent = () => {
      document.addEventListener('keydown', fn)
    }
    initEvent()
    runInAction(() => {
      tableStore.formRef = form
    })
    return () => {
      document.removeEventListener('keydown', fn)
    }
  }, [])

  const cls = useMemo(() => classNames(className, 'st-form-box'), [className])

  return (
    <Form className={cls} form={form} {...props} name="basic" autoComplete="off">
      <Space className="st-space-box" size={[16, 16]} wrap style={{ width: '100%' }}>
        {formItems?.map(({ children, ...item }, index) => (
          <Form.Item style={{ margin: 0 }} key={index} {...item}>
            {children}
          </Form.Item>
        ))}
        <Button type="primary" onClick={() => tableStore.getFetchData()}>
          搜索
        </Button>
        <Space style={{ display: 'flex' }}>{configNode}</Space>
      </Space>
    </Form>
  )
})
