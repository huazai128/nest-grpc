import { action, makeAutoObservable, observable } from 'mobx'
import { io, Socket } from 'socket.io-client'

export class SocketStore {
  private socket!: Socket
  constructor() {
    makeAutoObservable(this)
  }

  @action
  initScoket = () => {
    this.socket = io('ws://localhost:8081')
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
  }
}

export default new SocketStore()
