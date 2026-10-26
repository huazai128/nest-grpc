import { Form, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import Page from '@src/components/Page'

const DataVerview = () => {
  return (
    <Page title="数据总览">
      <Form>
        <Form.Item label="Upload" valuePropName="fileList">
          <Upload action="/api/upload" data={{ siteId: '63b6568f66704eb3458306d6' }} listType="picture-card">
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Page>
  )
}
export default DataVerview
