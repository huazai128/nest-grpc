import { Form, Select, SelectProps, Space } from 'antd'
import { useState } from 'react'
import ErrorBoundaryHoc from '../ErrorBoundary'
import { CategoryItem } from '@src/stores/GlobalStore/type'
import { MechanismType } from '@src/monitor/interfaces/util.interface'
import { TransportCategory } from '@src/interfaces/monitor.interface'

const categoryList: Array<CategoryItem> = [
  {
    value: TransportCategory.API,
    label: '接口上报',
  },
  {
    value: TransportCategory.CUSTOM,
    label: '自定义上报',
  },
  {
    value: TransportCategory.ERROR,
    label: '错误上报',
  },
  {
    value: TransportCategory.EVENT,
    label: '埋点上报',
  },
  {
    value: TransportCategory.PREF,
    label: '性能上报',
  },
  {
    value: TransportCategory.PV,
    label: 'PV上报',
  },
]

const errorList: Array<IGlobalStore.ErrorTypeItem> = [
  {
    label: '跨域报错',
    value: MechanismType.CS,
  },
  {
    label: 'HTTP请求报错',
    value: MechanismType.HP,
  },
  {
    label: 'JS代码错误',
    value: MechanismType.JS,
  },
  {
    label: 'Promise错误',
    value: MechanismType.UJ,
  },
  {
    label: '资源加载错误',
    value: MechanismType.RS,
  },
  {
    label: 'React组件错误',
    value: MechanismType.REACT,
  },
]

const CategorySelect = () => {
  const [categoryValue, setCategoryValue] = useState<string>()

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
            {errorList.map((item) => (
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
