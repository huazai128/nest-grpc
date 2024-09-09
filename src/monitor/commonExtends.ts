import config, { Config } from './config'
import sendLog, { SendLog } from './sendLog'

export class CommonExtends {
  protected sendLog!: SendLog
  protected config!: Config
  constructor() {
    this.sendLog = sendLog
    this.config = config
  }
}
