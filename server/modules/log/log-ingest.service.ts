import { Injectable } from '@nestjs/common'
import { TransportCategory } from '@app/constants/enum.contant'
import { isKafkaConsumerEnabled } from '@app/config/kafka.config'
import { KafkaService } from '@app/processors/kafka/kafka.service'
import { LogData } from './log.dto'
import { LogService } from './log.service'
import { SaveLogRequest } from '@app/protos/log'
import { createLogger } from '@app/utils/logger'
import { isProdEnv } from '@app/config'
import { QueryVisitor } from '@app/decorators/params.decorator'
import { RedisService } from '@app/processors/redis/redis.service'
import { grpcFallbackExecutor } from '@app/utils/boundedExecutor'

const logger = createLogger({ scope: 'LogIngestService', time: isProdEnv ? false : true })

const maxKafkaPayloadBytes = 1048576
const WEB_INFO_TIME = 3 * 24 * 60 * 60
const WEB_INFO = 'webInfo'
const PAGE_INFO = 'pageInfo'
const MULTI_MAX = 10

const supportedCategories = new Set<string>([
  TransportCategory.EVENT,
  TransportCategory.API,
  TransportCategory.ERROR,
  TransportCategory.CUSTOM,
  TransportCategory.PV,
  TransportCategory.PREF,
  TransportCategory.USER,
  TransportCategory.RV,
])

@Injectable()
export class LogIngestService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logService: LogService,
    private readonly cacheService: RedisService,
  ) {}

  private preparePayload(data: LogData): SaveLogRequest {
    return {
      ...data,
      title: data.title || '信托制物业小区',
    } as SaveLogRequest
  }

  private isSupported(data: LogData): boolean {
    return (
      data.category === TransportCategory.RV ||
      supportedCategories.has(String(data.category))
    )
  }

  private enqueueGrpcFallback(payload: SaveLogRequest): void {
    grpcFallbackExecutor.run(() => this.logService.saveLog(payload))
  }

  private estimateBytes(data: LogData): number {
    try {
      return new TextEncoder().encode(JSON.stringify(data)).length
    } catch {
      return maxKafkaPayloadBytes + 1
    }
  }

  /** 单条：Kafka 削峰，失败或未启 consumer 时限流 gRPC 兜底 */
  public kafkaSend(data: LogData): void {
    if (!this.isSupported(data)) {
      return
    }
    const payload = this.preparePayload(data)
    if (!isKafkaConsumerEnabled()) {
      this.enqueueGrpcFallback(payload)
      return
    }
    if (this.estimateBytes(data) > maxKafkaPayloadBytes) {
      this.enqueueGrpcFallback(payload)
      return
    }
    this.kafkaService.sendMessage(payload as LogData).subscribe((res) => {
      if (res === 'fail') {
        this.enqueueGrpcFallback(payload)
      }
    })
  }

  /** 批量：合并 Redis 后一次 Kafka send，减少 broker 往返 */
  public ingestMultiLogs(logs: Partial<LogData>[] | undefined, visitor: QueryVisitor): void {
    const slice = (logs || []).slice(0, MULTI_MAX)
    if (!slice.length) return

    void this.processMultiLogs(slice, visitor).catch((error) => {
      logger.error('multi 上报后台处理失败', error)
    })
  }

  private async processMultiLogs(items: Partial<LogData>[], visitor: QueryVisitor): Promise<void> {
    const kafkaBatch: LogData[] = []
    const grpcOversized: SaveLogRequest[] = []

    for (const item of items) {
      const cacheKey = `WEB_INFO:${item.traceId}`
      const pageCacheKey = `PAGE_INFO:${item.traceId}`

      if (item.category === WEB_INFO && item.traceId) {
        await this.cacheService.set(cacheKey, item, WEB_INFO_TIME)
        continue
      }
      if (item.category === PAGE_INFO && item.traceId) {
        await this.cacheService.set(pageCacheKey, item, WEB_INFO_TIME)
        continue
      }

      const [webInfo, pageInfo] = await Promise.all([
        this.cacheService.get<Record<string, unknown>>(cacheKey),
        this.cacheService.get<Record<string, unknown>>(pageCacheKey),
      ])

      const merged = {
        ...(webInfo || {}),
        ...(pageInfo || {}),
        ...item,
        ip: visitor.ip || '',
        ua: visitor.ua,
        ua_result: visitor.ua_result,
      } as LogData

      if (!this.isSupported(merged)) continue

      const payload = this.preparePayload(merged)
      if (!isKafkaConsumerEnabled()) {
        this.enqueueGrpcFallback(payload)
        continue
      }
      if (this.estimateBytes(merged) > maxKafkaPayloadBytes) {
        grpcOversized.push(payload)
        continue
      }
      kafkaBatch.push(merged)
    }

    for (const p of grpcOversized) {
      this.enqueueGrpcFallback(p)
    }

    if (!kafkaBatch.length) return

    const result = await this.kafkaService.sendMessageBatch(kafkaBatch)
    if (result === 'fail') {
      for (const row of kafkaBatch) {
        this.enqueueGrpcFallback(this.preparePayload(row))
      }
    }
  }
}
