import { Global, Module } from '@nestjs/common'
import { WsGateway } from './ws.gateway'

@Global()
@Module({
  imports: [],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WebsocketModule {}
