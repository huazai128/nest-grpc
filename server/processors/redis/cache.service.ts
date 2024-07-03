import { Injectable } from '@nestjs/common'
import { RedisService } from './redis.service'

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 设置缓存
   * @param {string} key
   * @param {string} value
   * @param {number} [ttl]
   * @return {*}
   * @memberof CacheService
   */
  public set(key: string, value: string, ttl?: number): Promise<void> {
    return this.redisService.set(key, value, ttl)
  }

  /**
   * 获取缓存
   * @template T
   * @param {string} key
   * @return {*}  {Promise<T>}
   * @memberof CacheService
   */
  public get<T>(key: string): Promise<T> {
    return this.redisService.get(key) as Promise<T>
  }

  /**
   * 删除缓存
   * @param {string} key
   * @return {*}  {Promise<Boolean>}
   * @memberof CacheService
   */
  public delete(key: string): Promise<Boolean> {
    return this.redisService.del(key)
  }
}
