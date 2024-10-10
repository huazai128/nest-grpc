import { AuthModule } from './auth/auth.module'
import { ProtousersModule } from './protousers/protousers.module'
import { RouterModule } from './router/router.module'
import { SiteModule } from './site/site.module'

export default [AuthModule, ProtousersModule, SiteModule, 

  // RouterModule 要放下最后
  RouterModule
 ]
