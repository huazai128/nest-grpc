import { useEffect } from 'react'
import { Form, Button, Input } from 'antd'
import { observer } from 'mobx-react-lite'
import useRootStore from '@src/stores/useRootStore'
import { useHistory } from 'react-router-dom'
import styles from './style.scss'

function Login() {
  const { authStore } = useRootStore()
  const history = useHistory()

  useEffect(() => {}, [])

  const onFinish = (values: any) => {
    authStore.login(values, () => {
      history.push('/')
    })
  }

  return (
    <div className={`${styles.loginBox} flex flex-center`}>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item label="账号" name="account" rules={[{ required: true, message: '请输入账号' }]}>
          <Input />
        </Form.Item>

        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default observer(Login)
