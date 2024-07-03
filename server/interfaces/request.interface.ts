/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      isLogin: boolean
    }
  }
}

export interface TimeInfo {
  startTime?: number
  endTime?: number
}
