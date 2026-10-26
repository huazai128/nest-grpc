import LogModal from '@src/components/LogModal'
import useRootStore from '@src/stores/useRootStore'
import { Modal, Space, Table, Typography } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import styles from './style.scss'
import { toJS } from 'mobx'

const ErrorModal = () => {
  const { userLogStore } = useRootStore()
  const { isVisible, errorList, open, title, logInfo, type, hideModal, hideErrorModal, onModalType } = userLogStore

  const columns: ColumnsType<any> = [
    {
      title: '错误类型',
      dataIndex: 'errorType',
      fixed: 'left',
      width: 120,
    },
    {
      title: '用户UUID',
      dataIndex: 'errorUUid',
      width: 150,
    },
    {
      title: '错误产生时间(用户系统时间)',
      dataIndex: 'time',
      render: (value: string) => (!!value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
      width: 200,
    },
    {
      title: '错误信息',
      dataIndex: 'value',
      width: 200,
      render: (value: string, record: any) => value || JSON.stringify(record?.meta || {}),
    },
    {
      title: '操作',
      dataIndex: 'id',
      render: (_, record: any) => (
        <Space direction="vertical">
          <Typography.Link onClick={() => onModalType('code', record, '查看源码')}>查看源码</Typography.Link>
          <Typography.Link onClick={() => onModalType('record', record, '查看录屏')}>查看录屏</Typography.Link>
          <Typography.Link onClick={() => onModalType('behavior', record, '查看用户行为')}>
            查看用户行为
          </Typography.Link>
        </Space>
      ),
      fixed: 'right',
      width: 150,
    },
  ]
  return (
    <Fragment>
      <Modal
        className={styles.errorListModal}
        title="错误列表"
        open={isVisible}
        footer={null}
        width={780}
        onCancel={hideErrorModal}
      >
        <Table
          columns={columns}
          dataSource={toJS(errorList).map((item) => ({ ...item, key: item.errorUUid }))}
          scroll={!!errorList.length ? { x: 'max-content', y: 480 } : undefined}
          pagination={{
            pageSize: 10,
          }}
        ></Table>
      </Modal>
      <LogModal open={open} title={title} logInfo={logInfo} type={type} hideModal={hideModal} />
    </Fragment>
  )
}

export default observer(ErrorModal)
