import sendLog, { SendLog } from './sendLog'

export class CommonExtends {
  protected sendLog!: SendLog
  constructor() {
    this.sendLog = sendLog
  }
}
