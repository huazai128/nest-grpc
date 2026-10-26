import { AuthModule } from './auth/auth.module'
import { ExpansionModule } from './expansion/expansion.module'
import { InterceptModule } from './intercept/intercept.module'
import { LogModule } from './log/log.module'
import { ProtousersModule } from './protousers/protousers.module'
import { RouterModule } from './router/router.module'
import { SiteModule } from './site/site.module'
import { ErrorModule } from './error/error.module'
import { NetworkSpeedLogModule } from './networkSpeedLog/networkSpeedLog.module'
import { PvBffModule } from './pv/pv.module'
import { PrefBffModule } from './pref/pref.module'
import { ApiLogBffModule } from './apiLog/apiLog.module'
import { EventLogBffModule } from './eventLog/eventLog.module'
import { CustomLogBffModule } from './customLog/customLog.module'
import { UserLogBffModule } from './userLog/userLog.module'

export default [
  AuthModule,
  ProtousersModule,
  SiteModule,
  LogModule,
  NetworkSpeedLogModule,
  PvBffModule,
  PrefBffModule,
  ApiLogBffModule,
  EventLogBffModule,
  CustomLogBffModule,
  UserLogBffModule,
  ExpansionModule,
  ErrorModule,

  // 拦截不存在的API，不让走入router module 中
  InterceptModule,
  RouterModule,
]
