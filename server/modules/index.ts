import { AuthModule } from './auth/auth.module'
import { ExpansionModule } from './expansion/expansion.module'
import { InterceptModule } from './intercept/intercept.module'
import { LogModule } from './log/log.module'
import { ProtousersModule } from './protousers/protousers.module'
import { RouterModule } from './router/router.module'
import { SiteModule } from './site/site.module'
import { ErrorModule } from './error/error.module'

export default [
  AuthModule,
  ProtousersModule,
  SiteModule,
  LogModule,
  ExpansionModule,
  ErrorModule,

  // 拦截不存在的API，不让走入router module 中
  InterceptModule,
  // RouterModule 要放下最后
  RouterModule,
]
