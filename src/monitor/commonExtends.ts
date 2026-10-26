import sendLog, { SendLog } from './sendLog'

/**
 * 采集模块基类，统一注入全局 SendLog 单例，避免各 Vitals 各自引用导致队列不一致。
 * @export
 * @class CommonExtends
 */
export class CommonExtends {
  /** 全局日志发送器（队列 / 上报 / 行为轨迹） */
  protected sendLog!: SendLog

  constructor() {
    this.sendLog = sendLog
  }
}
