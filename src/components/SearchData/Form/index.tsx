import React, { useEffect, useMemo } from 'react'
import { Form, Space, FormProps, FormItemProps, Button } from 'antd'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { ListStore } from '../List/store'
import { runInAction } from 'mobx'
import styles from './style.scss'

export interface IFormProps<T> extends Omit<FormProps, 'style'> {
  formItems?: Array<FormItemProps>
  configNode?: React.ReactNode
  listStore: ListStore
}

const FormBox = observer(<T,>({ className, formItems, listStore, configNode, ...props }: IFormProps<T>) => {
  const form = Form.useForm()[0]

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const event = e || window.event
      const key = event.which || event.keyCode || event.charCode
      if (key == 13) {
        listStore.loadMoreData()
      }
    }
    const initEvent = () => {
      document.addEventListener('keydown', fn)
    }
    initEvent()
    runInAction(() => {
      listStore.formRef = form
    })
    return () => {
      document.removeEventListener('keydown', fn)
    }
  }, [])

  const cls = useMemo(() => classNames(className, styles['st-form-box']), [className])

  return (
    <Form className={cls} form={form} {...props} name="basic" autoComplete="off">
      <Space className={styles['st-space-box']} size={[16, 16]} wrap style={{ width: '100%' }}>
        {formItems?.map(({ children, ...item }, index) => (
          <Form.Item style={{ margin: 0 }} key={index} {...item}>
            {children}
          </Form.Item>
        ))}
        <Button
          type="primary"
          onClick={() => {
            listStore.resetData(false)
            listStore.loadMoreData()
          }}
        >
          查询
        </Button>
        <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>{configNode}</Space>
      </Space>
    </Form>
  )
})

export default FormBox
