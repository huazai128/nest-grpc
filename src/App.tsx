import RouterComp from '@src/components/RouterComp'
import { RouterCompProps } from '@src/types'
import '@src/styles/flex.less'
import '@src/styles/common.scss'
import { configure } from 'mobx'
import './App.scss'
import { Monitor } from './monitor'

const monitor = new Monitor()

configure({
  enforceActions: 'never',
})

const App = (props: RouterCompProps) => <RouterComp {...props} />

export default App
