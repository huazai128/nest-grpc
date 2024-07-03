import React from 'react'
import { auth } from '@src/services/api'
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
