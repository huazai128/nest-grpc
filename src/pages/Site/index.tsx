import dayjs from 'dayjs'
import { SiteStore } from './store'
import { onMounted } from 'veact'
import { Link } from 'react-router-dom'
import Page from '@src/components/Page'
import { observer } from 'mobx-react-lite'
import SearchList from '@src/components/SearchData/SearchList'
import { Site as SiteItem } from '@src/interfaces/site.interface'
import { PageProvider, usePageStore, PageNode } from '@src/components/PageProvider'
import { Button, FormItemProps, Input, Layout, List, Popconfirm, Space, Typography } from 'antd'
import styles from './style.scss'
import EditSite from './components/EditSite'

const { Content } = Layout

const Provider = ({ children }: PageNode) => {
  return <PageProvider<SiteStore> store={new SiteStore()}>{children}</PageProvider>
}

const formList: Array<FormItemProps> = [
  {
    name: 'kw',
    label: '站点名称',
    children: <Input placeholder="请输入站点名称" />,
  },
]

const Site = observer(() => {
  const siteStore = usePageStore()
  onMounted(() => {
    console.log('页面挂载了')
  })
  return (
    <Page title="首页" className={styles.siteBox}>
      <Content className={styles.siteLayout} style={{ padding: '24px 50px' }}>
        <SearchList
          listStore={siteStore}
          formProps={{ formItems: formList }}
          listProps={{
            renderItem: (item: SiteItem) => (
              <List.Item key={item.id}>
                <Link to={`/admin/${item._id}/home`}>
                  {item.name}
                  <p>{dayjs(item.create_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                </Link>
                <Space>
                  <Typography.Link onClick={() => siteStore.handleModal(item)}>编辑</Typography.Link>
                  <Popconfirm title="请和研发确认好后在删除！！！" onConfirm={() => siteStore.delteSiteId(item._id)}>
                    <Typography.Link type="danger">删除</Typography.Link>
                  </Popconfirm>
                </Space>
              </List.Item>
            ),
          }}
        >
          <Button type="primary" onClick={() => siteStore.handleModal()}>
            新增站点
          </Button>
        </SearchList>
      </Content>
    </Page>
  )
})

export default function () {
  return (
    <Provider>
      <Site />
      <EditSite />
    </Provider>
  )
}
