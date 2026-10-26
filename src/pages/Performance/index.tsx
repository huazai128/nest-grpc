import Page from '@src/components/Page'
import { MetricsName } from '@src/types'
import { Col, Row } from 'antd'
import TimeConsuming, { PrefItem } from './TimeConsuming'
import styles from './style.scss'
import MaxTime from './MaxTime'

const list: PrefItem[] = [
  {
    title: '首次有效绘制时间(FCP)',
    type: MetricsName.FCP,
  },
  {
    title: '首次绘制(FP)',
    type: MetricsName.FP,
  },
  {
    title: '入口接口加载耗时',
    type: MetricsName.CDR,
  },
  {
    title: '第一个有意义的内容被渲染出来的时间点(FMP)',
    type: MetricsName.FMP,
  },
]

const Performance = () => {
  return (
    <Page title="性能分析" className={styles.prefBox}>
      <Row gutter={16}>
        {list.map((item) => (
          <Col key={item.type} style={{ marginBottom: '24px' }} className="gutter-row" span={12}>
            <TimeConsuming {...item} />
          </Col>
        ))}
        {list.map((item) => (
          <Col key={item.type} style={{ marginBottom: '24px' }} className="gutter-row" span={12}>
            <MaxTime {...item} />
          </Col>
        ))}
      </Row>
    </Page>
  )
}

export default Performance
