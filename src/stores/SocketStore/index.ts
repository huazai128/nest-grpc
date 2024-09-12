import config from '@src/config'
import { action, makeAutoObservable } from 'mobx'
import { io, Socket } from 'socket.io-client'

export class SocketStore {
  private socket!: Socket
  constructor() {
    makeAutoObservable(this)
  }

  @action
  initScoket = () => {
    this.socket = io(config.wsUrl)

    // 监听连接成功
    this.socket.on('connect', () => {
      console.log('连接成功')
    })

    // 监听断开连接
    this.socket.on('disconnect', () => {
      console.log('disconnect')
    })

    // 监听连接失败
    this.socket.on('connect_error', (err) => {
      console.log(err, '连接错误')
    })

    // 向events发送data
    this.socket.emit('events', { data: 'q23123' })

    // 返回数据
    this.socket.on('events', (data) => {
      console.log(data, 'data')
    })

    // 触发socket
    this.socket.emit('userLogin', { data: '登录成功' })

    // 监听socket
    this.socket.on('userLogin', (data) => {
      console.log(data, 'data')
    })
  }

  /**
   * 向 event 发送 数据
   * @param {string} event
   * @param {*} data
   * @memberof SocketStore
   */
  @action
  emitWs = (event: string, data: any) => {
    this.socket.emit(event, data)
  }

  /**
   * 监听事件 进行处理
   * @param {string} event
   * @memberof SocketStore
   */
  @action
  onMessage = <T>(event: string) => {
    return new Promise<T>((resolve) => {
      this.socket.on(event, (data) => {
        resolve(data)
      })
    })
  }
}

export default new SocketStore()
