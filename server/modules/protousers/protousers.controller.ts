import { OrderService } from '@app/protos/orders/service'
import { UserService } from '@app/protos/user'
import { Controller, OnModuleInit, Inject, Get } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs'

/**
 * 用于验证和测试
 * @export
 * @class ProtousersController
 * @implements {OnModuleInit}
 */
@Controller('protousers')
export class ProtousersController implements OnModuleInit {
  private userService: UserService
  constructor(@Inject('USERPROTO_PACKAGE') private client: ClientGrpc) {}

  async onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService')
  }

  @Get()
  async getProtoUsers() {
    return lastValueFrom(this.userService.getUsers({}))
  }

  @Get('test')
  getList() {
    return this.userService.find({
      id: 1,
    })
  }
}
