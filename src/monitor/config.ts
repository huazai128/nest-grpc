import 'reflect-metadata'
import { ConfigProps } from './interfaces/config.interface'

class Config {
  public config!: ConfigProps

  initConfig(config: ConfigProps) {
    this.config = config
  }

  getConfig(): ConfigProps {
    return this.config
  }
}

export default new Config()
