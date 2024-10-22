import { Form, Select, SelectProps, Space } from 'antd'
import { useState } from 'react'
import ErrorBoundaryHoc from '../ErrorBoundary'

const CategorySelect = () => {
  const [categoryValue, setCategoryValue] = useState<string>()
  const [categoryList, setCategoryList] = useState<any[]>([])
  const [errorTypeList, setErrorTypeList] = useState<any[]>([])

  const onChangeCategory: SelectProps['onChange'] = (value: string) => {
    setCategoryValue(value)
  }

  return (
    <Space size={[0, 0]}>
      <Form.Item noStyle name="category">
        <Select placeholder="请选择上报类型" allowClear onChange={onChangeCategory}>
          {categoryList.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      {Object.is(categoryValue, 'error') && (
        <Form.Item noStyle name="reportsType">
          <Select allowClear placeholder="请选择错误类型">
            {errorTypeList.map((item) => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </Space>
  )
}

export default ErrorBoundaryHoc(CategorySelect, 'CategorySelect')
