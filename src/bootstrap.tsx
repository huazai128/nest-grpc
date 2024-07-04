import ReactDOM from 'react-dom'
import App from './App'
import { Provider } from '@src/components/StoreProvider'

ReactDOM.render(
  <Provider>
    <App />
  </Provider>,
  document.getElementById('emp-root'),
)
