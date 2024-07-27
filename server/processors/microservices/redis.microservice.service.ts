import { REDIS_SERVICE } from '@app/constants/redis.constant'
import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'

@Injectable()
export class RedisMicroserviceService {
  constructor(@Inject(REDIS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * 基于request-response模式 发送
   * @param {*} pattern
   * @param {*} data
   * @return {*}
   * @memberof RedisMicroserviceService
   */
  public sendData(pattern: any, data: any) {
    return this.client.send(pattern, data)
  }

  /**
   * 基于事件模式 发送，只发布事件而不等待响应。
   * @param {*} pattern
   * @param {*} data
   * @return {*}
   * @memberof RedisMicroserviceService
   */
  public emitData(pattern: any, data: any) {
    return this.client.emit(pattern, data)
  }
}
