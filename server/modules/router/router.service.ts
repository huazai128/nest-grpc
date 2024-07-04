import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import { PageInfo } from './router.interface'
import { isDevEnv } from '@app/app.env'
import { getServerIp } from '@app/utils/util'
import { APP } from '@app/config'

/**
 * 处理路由下各种数据
 * @export
 * @class RouterSercive
 */
@Injectable()
export class RouterSercive {
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
}
