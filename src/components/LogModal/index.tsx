import BehaviorList from '@src/components/BehaviorList'
import ErrorCode from '@src/components/ErrorCode'
import Replayer from '@src/components/Replayer'
import { Modal } from 'antd'
import { toJS } from 'mobx'
import styles from './style.scss'
import ErrorBoundaryHoc from '../ErrorBoundary'
import { IPLocationResponse } from '@src/interfaces/log.interface'

interface IProps {
  open: boolean
  title?: string
  logInfo?: Record<string, any>
  hideModal?: () => void
  type?: string
  ipAnalysis?: IPLocationResponse
}

const LogModal = ({ open, title, logInfo, type, ipAnalysis, hideModal }: IProps) => {
  console.log('logInfo', type, toJS(ipAnalysis))
  const render = () => {
    switch (type) {
      case 'record':
        return <Replayer events={JSON.parse(logInfo?.events || '[]')} />
      case 'behavior':
        return <BehaviorList list={toJS(logInfo?.breadcrumbs) || []} />
      case 'code':
        const list: any = logInfo?.errorDetailList || []
        return <ErrorCode list={list} stackTrace={logInfo?.stackTrace} />
      case 'ip':
        return (
          <div className={styles.logItem}>
            {ipAnalysis && (
              <>
                <p>IP: {ipAnalysis?.ip || '-'}</p>
                <p>国家: {ipAnalysis?.country || '-'}</p>
                <p>省份: {ipAnalysis?.province || '-'}</p>
                <p>城市: {ipAnalysis?.city || '-'}</p>
                <p>国家代码: {ipAnalysis?.country_code || '-'}</p>
                <p>地区: {ipAnalysis?.region || '-'}</p>
                <p>地区代码: {ipAnalysis?.region_code || '-'}</p>
                <p>邮政编码: {ipAnalysis?.zip || '-'}</p>
                <p>纬度: {ipAnalysis?.latitude || '-'}</p>
                <p>经度: {ipAnalysis?.longitude || '-'}</p>
              </>
            )}
          </div>
        )
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
