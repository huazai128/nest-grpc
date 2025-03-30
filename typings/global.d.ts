declare interface Window {
  INIT_DATA: {
    categoryList: Array<CategotyItem>
    userInfo?: {
      name: string
      userId: number
    }
    apiHost?: string
    _id?: string

    [key: string]: any
  }
  sendUserLog?: (feedbackInfo: { content: string; oId: string }) => void
}

declare module 'worker-loader!*.ts' {
  class WebpackWorker extends Worker {
    constructor()
  }
  export default WebpackWorker
}

/**
 * 全局Store
 * @interface IStore
 */
interface IStore {
  globalStore: IGlobalStore.GlobalStore
  authStore: IAuthStore.AuthStorex
  socketStore: ISocketStore.SocketStore
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string }
  export = classes
}
