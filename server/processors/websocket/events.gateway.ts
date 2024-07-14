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

@WebSocketGateway(8081, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleDisconnect(client: any) {
    console.log('连接关闭')
  }

  handleConnection(client: any, ...args: any[]) {
    console.log('连接成功')
  }
  @WebSocketServer()
  server: Server

  @SubscribeMessage('events')
  handleMessage(@MessageBody() data: any): Observable<WsResponse<number>> {
    console.log('接收消息events的数据', data)
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })))
  }
}
