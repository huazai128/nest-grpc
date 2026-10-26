import { Controller, Get, Render, Req, UseGuards, Header, Param } from '@nestjs/common'
import { RouterGuard } from '@app/guards/router.guard'
import { Request } from 'express'
import { SessionPipe } from '@app/pipes/session.pipe'
import { QueryParams } from '@app/decorators/params.decorator'
import { RouterSercive } from './router.service'
import { createLogger } from '@app/utils/logger'

// 创建日志记录器
const logger = createLogger({ scope: 'RouterController', time: true })

// 通用的HTML响应头
const HTML_CONTENT_TYPE = 'content-type'
const HTML_CONTENT_VALUE = 'text/html'

/**
 * 路由控制器 - 处理所有页面渲染请求
 * @class RouterController
 */
@Controller()
export class RouterController {
  constructor(private readonly routeService: RouterSercive) {}

  /**
   * 登录页面渲染
   * @param {Request} req - 请求对象
   * @returns {Object} 渲染数据
   */
  @Get('login')
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('index')
  login(@QueryParams('request', new SessionPipe()) req: Request) {
    logger.info('login', req.url)
    return { data: { name: '登录页面' } }
  }

  /**
   * 错误页面渲染
   * @returns {Object} 错误页面数据
   */
  @Get('error')
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('error')
  getError() {
    return { data: { msg: ' 122' } }
  }

  /**
   * 带ID参数的页面渲染
   * 用于需要特定站点信息的页面
   * @param {Request} req - 请求对象
   * @param {string} id - 站点ID
   * @returns {Promise<Object>} 渲染数据
   */
  @Get('/admin/:siteId/*')
  @UseGuards(RouterGuard)
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('index')
  async adminPage(@Req() req: Request, @Param('siteId') siteId: string) {
    const commonData = this.routeService.getCommonData(req)
    const siteInfo = (await this.routeService.getSiteInfo(siteId)) || {}
    return { data: { ...commonData, ...siteInfo } }
  }

  @Get('/page/:id/*')
  @UseGuards(RouterGuard)
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('index')
  async homePage(@Req() req: Request, @Param('id') id: string) {
    const commonData = this.routeService.getCommonData(req)
    const siteInfo = (await this.routeService.getSiteInfo(id)) || {}
    return { data: { ...commonData, ...siteInfo } }
  }

  @Get('/action-detail/:id')
  @UseGuards(RouterGuard)
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('index')
  actionDetailPage(@Req() req: Request) {
    const commonData = this.routeService.getCommonData(req)
    return { data: { ...commonData } }
  }

  /**
   * 通用页面渲染处理
   * 处理所有未被其他路由捕获的请求
   * @param {Request} req - 请求对象
   * @returns {Object} 渲染数据
   */
  @Get('*')
  @UseGuards(RouterGuard)
  @Header(HTML_CONTENT_TYPE, HTML_CONTENT_VALUE)
  @Render('index')
  allPage(@Req() req: Request) {
    const commonData = this.routeService.getCommonData(req)
    return { data: { ...commonData } }
  }
}
