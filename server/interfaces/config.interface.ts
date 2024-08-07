import { RedisModuleOptions } from './redis.interface'

export interface ConfigServer {
  // 用于微服务链接
  redisConf: {
    port: number
    host: string
    no_ready_check?: boolean
    password?: string
    defaultCacheTTL?: number
    username?: string
  }
  // 用于缓存和session
  redis: RedisModuleOptions

  grpcUrl: string
}
