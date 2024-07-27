import { isDevEnv } from '@app/config'
import { createLogger } from '@app/utils/logger'
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { from, Observable, map, lastValueFrom, of } from 'rxjs'
import { Server } from 'socket.io'
import { RedisMicroserviceService } from '@app/processors/microservices/redis.microservice.service'
import { USER_LOGIN } from '@app/constants/pattern.constant'

const Logger = createLogger({ scope: 'EventsGateway', time: isDevEnv })

@WebSocketGateway(8081, {
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'], //要将 socket.io 与多个负载平衡实例一起使用，你必须通过在客户端 socket.io 配置中设置 transports: ['websocket'] 来禁用轮询
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisMicroserviceService) {}
  @WebSocketServer()
  server: Server

  handleDisconnect(client: any) {
    Logger.log('websocket 连接关闭')
  }

  handleConnection(client: any, ...args: any[]) {
    // this.server.emit('events', { data: 'websocket 连接成功' })
    Logger.log('websocket 连接成功')
  }

  /**
   * 提供给个服务调用
   * @param {string} events
   * @param {*} data
   * @memberof WsGateway
   */
  sendWs(events: string, data: any) {
    this.server.emit(events, data)
  }

  /**
   * 提供对外监听数据, 这里就要自己处理守卫、拦截器、异常处理。
   * @template T
   * @param {string} events
   * @return {*}  {Promise<T>}
   * @memberof WsGateway
   */
  onMessage<T>(events: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.server.on(events, (data) => {
        resolve(data)
      })
    })
  }

  /**
   * events 事件名称，SubscribeMessag 只适用于网关内监听消息。
   * @param {*} data
   * @return {*}  {Observable<WsResponse<number>>}
   * @memberof EventsGateway
   */
  @SubscribeMessage('events')
  handleMessage(@MessageBody() data: any): Observable<WsResponse<number>> {
    Logger.log('接收消息events的数据', data)
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })))
  }

  /**
   * 通过redis 发布订阅获取数据，可以是当前服务，也可以是其他服务获取。这样满足了守卫、拦截器、异常处理等逻辑处理。
   * @param {*} data
   * @return {*}  {Observable<WsResponse<any>>}
   * @memberof WsGateway
   */
  @SubscribeMessage('userLogin')
  handleLoginMessage(@MessageBody() data: any): Observable<WsResponse<any>> {
    Logger.log('接收消息userLogin的数据', data)
    return this.redisService.sendData(USER_LOGIN, data).pipe(map((data) => ({ event: 'userLogin', data })))
  }
}
