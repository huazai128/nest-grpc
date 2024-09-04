import { Inject, Injectable, InjectionToken, ReflectiveInjector } from '@tanbo/di'
import { UserVitals } from './userVitals'
import { WebVitals } from './webVitals'
import { SendLog } from './sendLog'
import { ConfigProps } from './interfaces/config.interface'
import { MetricsName } from './interfaces/util.interface'
import 'reflect-metadata'

export const ConfigToken = new InjectionToken<ConfigProps>('ConfigToken')

export class Monitor {
  constructor(data: ConfigProps) {
    const { url, appKey } = data
    if (!url) {
      throw '上报url为空'
    }
    if (!appKey) {
      throw '上报map 存储位置为空'
    }

    const injector = new ReflectiveInjector(null as any, [
      SendLog,
      UserVitals,
      WebVitals,
      {
        provide: ConfigToken,
        useValue: {
          name: '张三',
        },
      },
    ])
    // const sendLog = injector.get(SendLog)
    // const userVitals = injector.get(UserVitals)
    // const webVitals = injector.get(WebVitals)
    // sendLog.add(MetricsName.CBR, { name: '1' })
  }
}
