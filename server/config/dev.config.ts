import { ConfigServer } from '@app/interfaces/config.interface'

const config: ConfigServer = {
  redisConf: {
    host: 'localhost',
    port: 6379,
  },
  redis: {
    type: 'single',
    url: 'redis://localhost:6379',
  },
}

export default config
