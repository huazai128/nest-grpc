import { AuthInfo } from './auth.interface'
import { SessionInfo } from './session.interfave'

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      isLogin: boolean
      session: SessionInfo
      isRouter: boolean
    }

    interface AuthenticatedRequest extends Request {
      user: AuthInfo
    }

    interface UnauthenticatedRequest extends Request {
      user?: AuthInfo
    }
  }
}
