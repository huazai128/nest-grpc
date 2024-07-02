import { Controller, OnModuleInit, Inject, Get } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { Observable } from 'rxjs'

interface UserService {
  getUsers({}): Observable<any>
}

@Controller('protousers')
export class ProtousersController implements OnModuleInit {
  private userService: UserService

  constructor(@Inject('USERPROTO_PACKAGE') private client: ClientGrpc) {}

  async onModuleInit() {
    this.userService = this.client.getService<UserService>('UserService')
    Observable
  }

  @Get()
  async getProtoUsers() {
    const data = this.userService.getUsers({})
    console.log(data, '=====')
    return data
  }
}
