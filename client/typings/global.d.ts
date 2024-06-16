declare interface Window {
  INIT_DATA: {
    userInfo?: {
      name: string
      userId: number
    }
    apiHost?: string
    [key: string]: any
  }
}

declare module 'worker-loader!*.ts' {
  class WebpackWorker extends Worker {
    constructor()
  }
  export default WebpackWorker
}

