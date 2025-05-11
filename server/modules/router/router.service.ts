import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { PageInfo } from './router.interface'
import { isDevEnv } from '@app/app.env'
import { getServerIp } from '@app/utils/util'
import { APP } from '@app/config'
import { SiteService } from '../site/site.service'
import { MeasureAsyncTime } from '@app/decorators/async.decorator'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({
  scope: 'RouterSercive',
  time: true,
})

/**
 * 处理路由下各种数据
 * @export
 * @class RouterSercive
 */
@Injectable()
export class RouterSercive {
  constructor(private readonly siteService: SiteService) {}

  /**
   * 获取通用数据
   * @param {Request} req - Express请求对象
   * @returns {PageInfo} 页面通用信息
   * @memberof RouterSercive
   */
  public getCommonData(req: Request): PageInfo {
    // 从session中获取用户信息
    const user = req.session?.user

    // 构建基础数据对象
    const data: PageInfo = {
      userInfo: user && {
        name: user?.account,
        userId: user?.userId,
      },
    }

    // 开发环境下添加API主机地址
    if (isDevEnv) {
      data.apiHost = `http://${getServerIp()}:${APP.PORT}`
    }
    return data
  }

  /**
   * 获取站点信息
   * @param {string} id - 站点ID
   * @returns {Promise<any>} 站点信息
   * @memberof RouterSercive
   */
  @MeasureAsyncTime
  async getSiteInfo(id: string) {
    const res = await this.siteService.getByIdSiteInfo(id)
    logger.info('getSiteInfo', res)
    return res
  }
}
