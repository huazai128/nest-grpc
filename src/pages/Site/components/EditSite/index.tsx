import React from 'react'
import { Form, Input, Modal, Radio, message } from 'antd'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'
import { observer } from 'mobx-react-lite'
import * as api from '@src/services/api'
import { useStore } from '../../store'
import styles from './style.scss'

const { TextArea } = Input

const EditSite = observer(() => {
  const { isVisible, site, hideModal } = useStore()
  const [form] = Form.useForm()

  const onCreateSite = () => {
    form.validateFields().then(async (values) => {
      const apiRules = values.apiRules || '[]'
      try {
        if (!!apiRules) {
          try {
            values.apiRules = JSON.parse(apiRules)
          } catch (e) {}
        }
        values.recordWhiteList = values.recordWhiteList
          ?.split(',')
          ?.map((item: string) => Number(item))
          ?.filter((item: number) => item && !isNaN(item))
        const newSite = { ...values, state: 1 }
        const { status } = site?._id
          ? await api.site.updateSite(site?._id, newSite)
          : await api.site.createSite({ ...values, state: 1, id: 0 })

        if (Object.is(status, 'success')) {
          onCancel()
        }
      } catch (error) {
        message.info('请确定api屏蔽告警配置')
      }
    })
  }

  const onCancel = () => {
    form.resetFields()
    hideModal()
  }

  return (
    <Modal
      open={isVisible}
      title={site ? '编辑' : '新增'}
      onCancel={onCancel}
      onOk={onCreateSite}
      width={700}
      className={styles.siteModal}
    >
      <Form
        form={form}
        name="form_in_modal"
        initialValues={{ isApi: '1' }}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
          <Input placeholder="请输入站点名称" />
        </Form.Item>
        <Form.Item
          name="reportUrl"
          label="上报告警群接口"
          rules={[{ required: true, message: '请输入上报群告警接口' }]}
        >
          <Input placeholder="请输入上报群告警接口" />
        </Form.Item>
        <Form.Item
          name="isApi"
          label="是否上报API告警"
          rules={[{ required: true, message: '请选择是否上报API告警' }]}
        >
          <Radio.Group>
            <Radio value={1}>是</Radio>
            <Radio value={0}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="apiRules" label="api屏蔽告警配置">
          <TextArea
            showCount
            style={{ height: 360, marginBottom: 24 }}
            placeholder="请输入api屏蔽告警配置json字符串"
          />
        </Form.Item>
        <Form.Item name="recordWhiteList" label="录制白名单">
          <TextArea
            showCount
            style={{ height: 360, marginBottom: 24 }}
            placeholder="请输入录制白名单用户id逗号分隔"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default ErrorBoundaryHoc(EditSite, 'EditSite')
