import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from '@nestjs/websockets'
import { from, Observable, map } from 'rxjs'
import { Server } from 'socket.io'

@WebSocketGateway(8081, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server

  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    console.log('我执行了两次')
    console.log('接收消息events的数据', data)
    return from([1, 2, 3]).pipe(map((item) => ({ event: 'events', data: item })))
  }
}
