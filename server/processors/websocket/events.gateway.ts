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
import { from, Observable, map } from 'rxjs'
import { Server } from 'socket.io'

const Logger = createLogger({ scope: 'EventsGateway', time: isDevEnv })

@WebSocketGateway(8081, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  handleDisconnect(client: any) {
    Logger.log('websocket 连接关闭')
  }

  handleConnection(client: any, ...args: any[]) {
    Logger.log('websocket 连接成功')
  }

  /**
   * events 事件名称
   * @param {*} data
   * @return {*}  {Observable<WsResponse<number>>}
   * @memberof EventsGateway
   */
  @SubscribeMessage('events')
  handleMessage(@MessageBody() data: any): Observable<WsResponse<number>> {
    Logger.log('接收消息events的数据', data)
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })))
  }

  @SubscribeMessage('userLogin')
  handleUserLogin(@MessageBody() data: any): Observable<WsResponse<number>> {
    Logger.log('接收消息userLogin的数据', data)
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })))
  }
}
