import RcEchart from '@src/components/RcEchart'
import TotalData from '@src/components/TotalData'
import useRootStore from '@src/stores/useRootStore'
import { Card, Space, Typography } from 'antd'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import styles from './style.scss'

const CardData = () => {
  const { logStore } = useRootStore()
  return (
    <Card bordered={false} className={styles.cardData}>
      <RcEchart height={110} data={toJS(logStore.chartList)} xField="startTime" yField="count" />
      <TotalData total={logStore.page.total} />
    </Card>
  )
}

export default observer(CardData)
