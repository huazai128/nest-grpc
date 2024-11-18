import Page from '@src/components/Page'
import { Input, FormItemProps } from 'antd'
import { observer } from 'mobx-react-lite'
import SearchList from '@src/components/SearchData/SearchList'
import LogDetail from './components/LogDetail'
import CategorySelect from '@src/components/CategorySelect'
import CardChart from './components/CardChart'
import LogModal from '@src/components/LogModal'
import AggregationData from '@src/components/AggregationData'
import { Site } from '@src/interfaces/site.interface'
import { LogsProvider, useLogStore } from './store'

const formList: Array<FormItemProps> = [
  {
    label: '上报类型',
    children: <CategorySelect />,
  },
  {
    name: 'keyId',
    label: '用户ID/IP',
    children: <Input style={{ width: '200px' }} placeholder="请输入用户ID或者IP查询" />,
  },
  {
    name: 'keywordParmas',
    label: '关键字搜索',
    children: (
      <Input.TextArea
        style={{ width: '400px' }}
        autoSize={{ maxRows: 2, minRows: 1 }}
        placeholder="请输入关键字搜索, 搜索规则{key: value,key: value}"
      />
    ),
  },
  // {
  //   name: 'time',
  //   label: '日期',
  //   children: <DateSelect />,
  // },
]

const TableAggregation = observer(() => {
  const { isLoaddingAgg, aggData, aggPage, onPageChange } = {} as any
  return (
    <AggregationData
      pagination={{
        pageSize: aggPage.size,
        total: aggPage.total,
        current: aggPage.page,
        onChange: onPageChange,
      }}
      loading={isLoaddingAgg}
      dataSource={aggData}
    />
  )
})

const Logs = observer(() => {
  const logStore = useLogStore()
  const { open, title, logInfo, type, aggregationPathOrUrlData, hideModal, updateType } = logStore

  const onSelectMenu = (type: string) => {
    updateType(type)
    if (!Object.is(type, 'default')) {
      aggregationPathOrUrlData()
    }
  }

  return (
    <>
      <Page title="日志集合">
        <SearchList
          showPaginateMode
          listStore={logStore}
          isPagination
          formProps={{ formItems: formList }}
          // centerChildren={}
          listProps={{
            isScrollData: false,
            renderItem: (item: Site, index: number) => (
              <LogDetail onModalType={logStore.onModalType} idx={index + 1} {...item} />
            ),
          }}
          menuProps={{
            onSelectMenu: onSelectMenu,
            items: [
              {
                key: 'page',
                label: '根据页面聚合',
                render: <TableAggregation />,
              },
              {
                key: 'api',
                label: '根据接口聚合',
                render: <TableAggregation />,
              },
            ],
          }}
        ></SearchList>
      </Page>
      <LogModal open={open} title={title} logInfo={logInfo} type={type} hideModal={hideModal} />
    </>
  )
})

export default function () {
  return (
    <LogsProvider>
      <Logs />
    </LogsProvider>
  )
}
