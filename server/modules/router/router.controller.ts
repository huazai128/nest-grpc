import { Controller, Get, Render, Req, UseGuards, Header } from '@nestjs/common'
import { RouterGuard } from '@app/guards/router.guard'
import { Request } from 'express'
import { SessionPipe } from '@app/pipes/session.pipe'
import { QueryParams } from '@app/decorators/params.decorator'
import { RouterSercive } from './router.service'

@Controller()
export class RouterController {
  constructor(private readonly routeService: RouterSercive) {}
  /**
   * 渲染页面
   * @param {Request} req
   * @return {*}
   * @memberof AppController
   */
  @Get('login')
  @Header('content-type', 'text/html')
  @Render('index')
  login(@QueryParams('request', new SessionPipe()) req: Request) {
    return { data: { name: '登录页面' } }
  }

  /**
   * 错误页面
   * @return {*}
   * @memberof AppController
   */
  @Get('error')
  @Header('content-type', 'text/html')
  @Render('error')
  getError() {
    return { data: { msg: ' 122' } }
  }

  /**
   * 首页
   * @param {Request} req
   * @return {*}
   * @memberof AppController
   */
  @Get('/page/*')
  @UseGuards(RouterGuard)
  @Header('content-type', 'text/html')
  @Render('index')
  homePage(@Req() req: Request) {
    const data = this.routeService.getCommonData(req)
    return { data: { ...data } }
  }

  /**
   * 通用页面渲染
   * @param {Request} req
   * @return {*}
   * @memberof AppController
   */
  @Get('*')
  @UseGuards(RouterGuard)
  @Header('content-type', 'text/html')
  @Render('index')
  allPage(@Req() req: Request) {
    const data = this.routeService.getCommonData(req)
    return { data: { ...data } }
  }
}
