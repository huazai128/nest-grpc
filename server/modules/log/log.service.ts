import { Inject, Injectable } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { LogRequest, LogService as LogServiceT } from '@app/protos/log'

@Injectable()
export class LogService {
  public logService: LogServiceT

  constructor(@Inject('LOGPROTO_PACKAGE') private client: ClientGrpc) {}
  onModuleInit() {
    this.logService = this.client.getService<LogServiceT>('LogService')
  }
  async saveLog(data: LogRequest) {
    console.log(data, 'data=====')
    await this.logService.saveLog(data)
  }
}
