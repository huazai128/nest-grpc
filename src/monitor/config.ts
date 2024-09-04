import { ConfigProps } from './interfaces/config.interface'

export class Config {
  public config!: ConfigProps

  setConfig(config: ConfigProps) {
    console.log(config, 'config')
    this.config = config
  }

  getConfig(): ConfigProps {
    return this.config
  }
}

export default new Config()
