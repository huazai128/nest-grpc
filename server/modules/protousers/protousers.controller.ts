import { OrderService } from '@app/protos/orders/service'
import { UserService } from '@app/protos/user'
import { Controller, OnModuleInit, Inject, Get } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom, ReplaySubject, Subject, toArray } from 'rxjs'
import * as GRPC from '@grpc/grpc-js'

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
      itemTypes: [1],
    })
  }
  @Get('test1')
  steamVerfiy() {
    // ReplaySubject 是 RxJS 中的一个特殊类型的 Subject，它可以记录并重放一定数量的值给新的订阅者
    // 这段代码的目的是将使用 ReplaySubject 记录的值传递给 userService.sync() 方法进行同步操作，并将同步结果作为 Observable 进行返回。
    const ids$ = new ReplaySubject<any>()
    ids$.next({ id: 1 })
    ids$.next({ id: 4 })
    ids$.complete()
    //
    const stream = this.userService.sync(ids$.asObservable())
    // 将流中的所有值收集到一个数组中
    return stream.pipe(toArray())
  }

  @Get('test2')
  streamReq() {
    const upstream = new ReplaySubject<any>()
    upstream.next({
      id: 1,
      itemTypes: [1],
    })
    upstream.complete()
    return this.userService.streamReq(upstream)
  }

  @Get('test3')
  streamReqCall() {
    const upstream = new Subject<any>()
    upstream.next({
      id: 1,
      itemTypes: [1],
    })
    upstream.complete()

    const call$ = this.userService.streamReqCall(upstream)
    return call$
  }
}
