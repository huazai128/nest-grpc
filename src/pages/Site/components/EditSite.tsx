import React, { useCallback, useEffect } from 'react'
import useRootStore from '@src/stores/useRootStore'
import { Form, Input, Modal, Radio, message } from 'antd'
import { observer } from 'mobx-react-lite'
import { reaction, toJS } from 'mobx'
import ErrorBoundaryHoc from '@src/components/ErrorBoundary'

const { TextArea } = Input

const EditSite = observer(() => {
  const { siteStore } = useRootStore()
  const [form] = Form.useForm()

  useEffect(() => {
    reaction(
      () => siteStore.site,
      () => {
        const site = toJS(siteStore.site)

        let apiRules = '[]'
        if (site?.apiRules) {
          try {
            apiRules = JSON.stringify(site.apiRules)
          } catch (e) {
            apiRules = '[]'
          }
        }

        let recordWhiteList = ''
        if (site?.recordWhiteList) {
          recordWhiteList = site.recordWhiteList?.join(',')
        }

        if (site) {
          form.setFieldsValue({ name: site?.name, reportUrl: site?.reportUrl, apiRules: apiRules, recordWhiteList })
        }
      },
    )
  }, [])

  const onCreateSite = useCallback(() => {
    form.validateFields().then(async (values) => {
      const apiRules = values.apiRules || '[]'
      try {
        if (!!apiRules) {
          try {
            values.apiRules = JSON.parse(apiRules)
          } catch (e) {
            values.apiRules = []
          }
        }

        values.recordWhiteList = values.recordWhiteList
          .split(',')
          .map((item: string) => Number(item))
          .filter((item: number) => item && !isNaN(item))

        const status = await siteStore.editSite({ ...values, isApi: 1 })
        if (Object.is(status, 'success')) {
          form.resetFields()
        }
      } catch (error) {
        message.info('请确定api屏蔽告警配置')
      }
    })
  }, [])

  return (
    <Modal
      open={siteStore.isVisible}
      title="新增站点"
      onCancel={() => {
        form.resetFields()
        siteStore.handleModal()
      }}
      onOk={onCreateSite}
      width={700}
      bodyStyle={{
        maxHeight: '600px',
        overflow: 'auto',
        paddingRight: '16px',
      }}
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
        {/* <Form.Item
          name="isApi"
          label="是否上报API告警"
          rules={[{ required: true, message: '请选择是否上报API告警' }]}
        >
          <Radio.Group>
            <Radio value={1}>是</Radio>
            <Radio value={0}>否</Radio>
          </Radio.Group>
        </Form.Item> */}
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
