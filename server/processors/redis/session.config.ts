import { NestSessionOptions } from 'nestjs-session'
import { RedisService } from './redis.service'
import { SESSION } from '@app/config'
import RedisStore from 'connect-redis'

/** @type {*}
 * session Provide
 */
export const sessionProvider = {
  useFactory: async (redisService: RedisService): Promise<NestSessionOptions> => {
    let redisStore = new RedisStore({
      client: redisService.client,
    })
    return {
      session: {
        store: redisStore,
        ...SESSION,
      },
    }
  },
  inject: [RedisService],
}
