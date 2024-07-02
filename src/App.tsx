import React from 'react'
import { Button } from 'src/Button'
import StoreComp from './StoreComp'
import incStore from './store/incStore'
import { auth } from '@src/services/api'
export { Button, StoreComp, incStore }
const App = () => {
  return (
    <>
      <h1>Micro Host大苏打</h1>
      <div style={{ padding: 0 }} onClick={() => { 
        auth.login({
          account: 'admin',
          password: 'admin'
        })
      }}>登录</div>
    </>
  )
}
export default App
