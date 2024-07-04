import { ConfigParams } from '@src/interfaces/config.interface'

const config: ConfigParams = {
  apiHost: window.INIT_DATA?.apiHost || '',
}

export default config
