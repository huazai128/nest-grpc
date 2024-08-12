import { ConfigProps } from './interfaces/config.interface'

export class Monitor {
  constructor(data: ConfigProps) {
    const { url, appKey } = data
    if (!url) {
      throw '上报url为空'
    }
    if (!appKey) {
      throw '上报map 存储位置为空'
    }
  }
}
