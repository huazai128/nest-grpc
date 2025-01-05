import RouterComp from '@src/components/RouterComp'
import { RouterCompProps } from '@src/types'
import '@src/styles/flex.less'
import '@src/styles/common.scss'
import { configure } from 'mobx'
import './App.scss'
import { Monitor } from './monitor'
import config from './config'

const monitor = new Monitor({
  url: `${config.apiHost}` || 'http://172.26.130.15:5001',
  isExposure: true,
  appKey: '677a8c554e96c1ebff6622e5', //上报map 存储位置
  mode: 'test', // 环境
  isOnRecord: true,
})

configure({
  enforceActions: 'never',
})

const App = (props: RouterCompProps) => <RouterComp {...props} />

export default App
