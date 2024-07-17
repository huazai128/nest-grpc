import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createRedisConnection } from '@app/processors/redis/redis.util'
import { CONFIG } from '@app/config'

/**
 * Redis 适配器
 * @export
 * @class RedisIoAdapter
 * @extends {IoAdapter}
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>

  // 连接redis
  async connectToRedis(): Promise<void> {
    const pubClient = createRedisConnection(CONFIG.redis)
    const subClient = pubClient.duplicate()
    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
