import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { LogRequest, LogService as LogServiceT } from '@app/protos/log'
import { lastValueFrom } from 'rxjs'
import { Status } from '@grpc/grpc-js/build/src/constants'
import { createLogger } from '@app/utils/logger'

const Logger = createLogger({ scope: 'LogService', time: true })

@Injectable()
export class LogService implements OnModuleInit {
  public logService: LogServiceT

  constructor(@Inject('LOGPROTO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.logService = this.client.getService<LogServiceT>('LogService')
  }

  async saveLog(data: LogRequest) {
    console.log(data, 'data====')
    try {
      // 不加await会报错。这里会存在问题，当大量数据过来会导致CPU和内存都会偏高告警。这里要使用kafaka处理好些
      await lastValueFrom(this.logService.saveLog(data as any))
    } catch (error) {
      Logger.error('错误信息:', error.code, error.message)
    }
  }
}
