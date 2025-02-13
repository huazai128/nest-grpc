import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createRedisConnection } from '@app/processors/redis/redis.util'
import { CONFIG } from '@app/config'
import { Logger } from '@nestjs/common'

/**
 * Redis Socket.IO 适配器
 * 用于处理WebSocket连接的分布式扩展
 * @export
 * @class RedisIoAdapter
 * @extends {IoAdapter}
 */
export class RedisIoAdapter extends IoAdapter {
  // Redis适配器构造器
  private adapterConstructor: ReturnType<typeof createAdapter>

  /**
   * 连接到Redis服务器
   * 创建发布和订阅客户端用于Socket.IO的分布式通信
   */
  async connectToRedis(): Promise<void> {
    try {
      // 创建Redis发布客户端
      const pubClient = createRedisConnection(CONFIG.redis)
      // 复制一个订阅客户端
      const subClient = pubClient.duplicate()

      // 监听Redis连接错误
      pubClient.on('error', (err) => {
        Logger.error('Redis发布客户端连接错误:', err)
      })

      subClient.on('error', (err) => {
        Logger.error('Redis订阅客户端连接错误:', err)
      })

      // 创建Socket.IO Redis适配器
      this.adapterConstructor = createAdapter(pubClient, subClient)

      Logger.log('Redis Socket.IO适配器连接成功')
    } catch (error) {
      Logger.error('Redis Socket.IO适配器连接失败:', error)
      throw error
    }
  }

  /**
   * 创建Socket.IO服务器并应用Redis适配器
   * @param port 服务器端口
   * @param options Socket.IO配置选项
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    // 将Redis适配器附加到Socket.IO服务器
    server.adapter(this.adapterConstructor)
    return server
  }
}
