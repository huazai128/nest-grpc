import { ReflectiveInjector } from '@tanbo/di'
import { SendLog } from './sendLog'

export class CommonExtends {
  private sendLog: SendLog
  constructor() {
    const injector = new ReflectiveInjector(null as any, [SendLog])
    this.sendLog = injector.get(SendLog)
  }
}
