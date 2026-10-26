import Page from '@src/components/Page'
import { Layout, Input, FormItemProps, Button, List, Space, Typography, Popconfirm } from 'antd'
import SearchList from '@src/components/SearchData/SearchList'
import useRootStore from '@src/stores/useRootStore'
import EditSite from './components/EditSite'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import styles from './style.scss'

const { Content } = Layout

const formList: Array<FormItemProps> = [
  {
    name: 'kw',
    label: '站点名称',
    children: <Input placeholder="请输入站点名称" />,
  },
]

const Site = () => {
  const { siteStore } = useRootStore()

  return (
    <Page title="站点" className={styles.siteBox}>
      <Content className={styles.siteLayout} style={{ padding: '24px 50px' }}>
        <SearchList
          listStore={siteStore}
          formProps={{ formItems: formList }}
          listProps={{
            renderItem: (item: ISiteStore.Site) => (
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
      <EditSite />
    </Page>
  )
}

export default Site
