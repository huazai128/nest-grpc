import RcEchart from '@src/components/RcEchart'
import TotalData from '@src/components/TotalData'
import { Card } from 'antd'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import styles from './style.scss'
import { useLogStore } from '../../store'

const CardData = () => {
  const logStore = useLogStore()
  return (
    <Card bordered={false} className={styles.cardData}>
      <RcEchart height={110} data={toJS(logStore.chartList)} xField="startTime" yField="count" />
      <TotalData total={logStore.page.total} />
    </Card>
  )
}

export default observer(CardData)
