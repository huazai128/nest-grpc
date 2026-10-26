import { useEffect } from 'react'
import BehaviorList from 'src/components/BehaviorList'
import Styles from './index.scss'
import useRootStore from '@src/stores/useRootStore'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'
import { message } from 'antd'

const ActionDetail = observer(() => {
  const { id } = useParams<{ id?: string }>()
  const { logStore } = useRootStore()

  useEffect(() => {
    if (id) {
      logStore.getuserReportInfo(+id)
    } else {
      message.error('id不能为空')
    }
  }, [])

  return (
    <div className={Styles['action-detail']}>
      <BehaviorList list={logStore.logInfo?.breadcrumbs || []} />
    </div>
  )
})

export default ActionDetail
