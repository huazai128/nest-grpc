import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { PageInfo } from './router.interface'
import { isDevEnv } from '@app/app.env'
import { getServerIp } from '@app/utils/util'
import { APP } from '@app/config'
import { SiteService } from '../site/site.service'

/**
 * 处理路由下各种数据
 * @export
 * @class RouterSercive
 */
@Injectable()
export class RouterSercive {
  constructor(private readonly siteService: SiteService) {}
  public getCommonData(req: Request): PageInfo {
    const user = req.session?.user

    const data: PageInfo = {
      userInfo: user && {
        name: user?.account,
        userId: user?.userId,
      },
    }
    if (isDevEnv) {
      data.apiHost = `http://${getServerIp()}:${APP.PORT}`
    }
    return data
  }

  async getSiteInfo(id: string) {
    const res = await this.siteService.getByIdSiteInfo(id)
    return res
  }
}
