import PageContent from '@src/components/Page/PageContent'
import Styles from './style.scss'
import { Card, Row, Col } from 'antd'
import terminalStore, { TerminalMap } from './store'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { SwitchTimeHead } from '@src/components/TitleHead'
import BarEchart from '@src/components/RcEchart/BarEchart'
import PageStatistics from './PageStatistics'

const Terminal = () => {
  const { mList, termianlMaps, getTerminalData } = useLocalObservable(() => terminalStore)
  return (
    <PageContent title="终端分析" className={Styles.terminalBox}>
      <Row gutter={16} className="mbottom-24">
        {mList.map((item) => {
          const mapData = termianlMaps.get(item) as TerminalMap
          return (
            <Col span={8} key={item}>
              <Card>
                <SwitchTimeHead
                  isTodayStart
                  onSwitchChange={(date) => getTerminalData(date, item)}
                  title={mapData.title}
                />
                <div className="mbottom-24">
                  <BarEchart
                    xField="count"
                    yField="name"
                    data={mapData.list}
                    xAxis={{ maxLimit: !mapData.total ? 1 : null }}
                    total={mapData.total}
                  />
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
      <PageStatistics />
    </PageContent>
  )
}

export default observer(Terminal)
