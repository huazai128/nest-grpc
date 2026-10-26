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
import { hydrateCollectedAliases } from './logPayload.util'

const logger = createLogger({ scope: 'LogIngestService', time: isProdEnv ? false : true })

/** Kafka 单条消息上限（字节），超限改走 gRPC 兜底 */
const maxKafkaPayloadBytes = 1048576
/** webInfo / pageInfo 在 Redis 的 TTL（秒），默认 3 天 */
const WEB_INFO_TIME = 3 * 24 * 60 * 60
/** 会话级网页信息 category，只写 Redis 不入库 */
const WEB_INFO = 'webInfo'
/** 页面级信息 category，只写 Redis 不入库 */
const PAGE_INFO = 'pageInfo'
/** /multi 单次最多处理条数，超出截断并打日志 */
const MULTI_MAX = 100
/** 写入 Redis 时跳过的瞬时字段，避免污染后续日志合并 */
const CACHE_SKIP_KEYS = new Set(['category', 'reportsType', 'timestamp'])

/**
 * 抽出可缓存的网页/页面字段，附带本批 siteId/traceId。
 * 空值不写，避免把空串覆盖掉 Redis 里已有的有效值。
 * @param {Partial<LogData>} item
 * @param {{ siteId?: string, traceId?: string }} extras 批次外层会话字段
 * @return {Record<string, unknown>}
 */
function pickCacheFields(
  item: Partial<LogData>,
  extras: { siteId?: string; traceId?: string },
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...extras }
  Object.entries(item).forEach(([key, value]) => {
    if (CACHE_SKIP_KEYS.has(key)) return
    if (value === undefined || value === null || value === '') return
    out[key] = value
  })
  return out
}

/** 允许入库的业务 category；webInfo / pageInfo 只进 Redis，不在此集合 */
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

/**
 * HTTP 上报入口：/multi 批量合并 Redis 后进 Kafka，失败再 gRPC 兜底。
 * 负责外层 siteId/traceId、pageId 批内回填、压缩字段还原。
 */
@Injectable()
export class LogIngestService {
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logService: LogService,
    private readonly cacheService: RedisService,
  ) {}

  /** 转成 gRPC SaveLogRequest；当前即浅拷贝，保留 hydrate 后的别名 */
  private preparePayload(data: LogData): SaveLogRequest {
    return { ...data } as SaveLogRequest
  }

  /** webInfo/pageInfo 以外、且在 supportedCategories 内才允许入库 */
  private isSupported(data: LogData): boolean {
    return (
      data.category === TransportCategory.RV ||
      supportedCategories.has(String(data.category))
    )
  }

  /** Kafka 不可用或超限时限流调用 nest-server saveLog */
  private enqueueGrpcFallback(payload: SaveLogRequest): void {
    grpcFallbackExecutor.run(() => this.logService.saveLog(payload))
  }

  /** 估算 JSON 字节；序列化失败视为超限，避免把坏数据塞进 Kafka */
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
  public async ingestMultiLogs(
    body: { logs?: Partial<LogData>[]; siteId?: string; traceId?: string } | Partial<LogData>[] | undefined,
    visitor: QueryVisitor,
  ): Promise<void> {
    const logs = Array.isArray(body) ? body : body?.logs
    const siteId = Array.isArray(body) ? undefined : body?.siteId
    const traceId = Array.isArray(body) ? undefined : body?.traceId
    const list = logs || []
    if (list.length > MULTI_MAX) {
      logger.warn(`multi 上报 ${list.length} 条，截断为 ${MULTI_MAX}`)
    }
    const slice = list.slice(0, MULTI_MAX)
    if (!slice.length) return

    await this.processMultiLogs(slice, visitor, { siteId, traceId })
  }

  /**
   * 逐条：webInfo/pageInfo 写 Redis；普通日志合并缓存、回填 pageId、还原压缩字段后组 Kafka 批。
   * 单条带 traceId 时优先于批次外层，避免跨会话补报串会话。
   */
  private async processMultiLogs(
    items: Partial<LogData>[],
    visitor: QueryVisitor,
    batchMeta: { siteId?: string; traceId?: string },
  ): Promise<void> {
    const kafkaBatch: LogData[] = []
    const grpcOversized: SaveLogRequest[] = []
    let lastPageId: string | undefined

    for (const raw of items) {
      const item = { ...raw }
      const traceId = item.traceId || batchMeta.traceId
      const siteId = item.siteId || batchMeta.siteId
      if (!item.pageId && lastPageId) {
        item.pageId = lastPageId
      }
      if (typeof item.pageId === 'string' && item.pageId) {
        lastPageId = item.pageId
      }
      const cacheKey = `WEB_INFO:${traceId}`
      const pageCacheKey = `PAGE_INFO:${traceId}`

      if (item.category === WEB_INFO && traceId) {
        await this.cacheService.set(cacheKey, pickCacheFields(item, { siteId, traceId }), WEB_INFO_TIME)
        continue
      }
      if (item.category === PAGE_INFO && traceId) {
        await this.cacheService.set(pageCacheKey, pickCacheFields(item, { siteId, traceId }), WEB_INFO_TIME)
        lastPageId = (item.pageId as string) || lastPageId
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
        siteId,
        traceId,
        ip: visitor.ip || '',
        ua: visitor.ua,
        ua_result: visitor.ua_result,
      } as LogData

      hydrateCollectedAliases(merged as Record<string, unknown>)

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
