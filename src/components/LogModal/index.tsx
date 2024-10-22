import BehaviorList from '@src/components/BehaviorList'
import ErrorCode from '@src/components/ErrorCode'
import Replayer from '@src/components/Replayer'
import { Modal } from 'antd'
import { toJS } from 'mobx'
import styles from './style.scss'
import ErrorBoundaryHoc from '../ErrorBoundary'

interface IProps {
  open: boolean
  title?: string
  logInfo?: Record<string, any>
  hideModal?: () => void
  type?: string
}

const LogModal = ({ open, title, logInfo, type, hideModal }: IProps) => {
  const render = () => {
    switch (type) {
      case 'record':
        return <Replayer events={JSON.parse(logInfo?.events || '[]')} />
      case 'behavior':
        return <BehaviorList list={toJS(logInfo?.breadcrumbs) || []} />
      case 'code':
        const obj: any = JSON.parse(logInfo?.errorDetail || '{}')
        return <ErrorCode {...obj} stackTrace={logInfo?.stackTrace} />
    }
  }
  return (
    <Modal
      open={open}
      title={title}
      width={800}
      footer={null}
      onCancel={() => hideModal?.()}
      className={`${styles.logModal} on-visible`}
    >
      {render()}
    </Modal>
  )
}

export default ErrorBoundaryHoc(LogModal, 'LogModal')
