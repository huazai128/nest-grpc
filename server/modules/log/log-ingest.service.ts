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
const MULTI_MAX = 100
const CACHE_SKIP_KEYS = new Set(['category', 'reportsType', 'timestamp'])

function splitQueryUrl(queryUrl: string): { url: string; params?: Record<string, string> } {
  const q = queryUrl.indexOf('?')
  const url = q === -1 ? queryUrl : queryUrl.slice(0, q)
  if (q === -1 || q === queryUrl.length - 1) return { url }
  const params: Record<string, string> = {}
  queryUrl
    .slice(q + 1)
    .split('&')
    .forEach((pair) => {
      if (!pair) return
      const eq = pair.indexOf('=')
      const rawKey = eq === -1 ? pair : pair.slice(0, eq)
      const rawVal = eq === -1 ? '' : pair.slice(eq + 1)
      try {
        const key = decodeURIComponent(rawKey.replace(/\+/g, ' '))
        const value = decodeURIComponent(rawVal.replace(/\+/g, ' '))
        if (key) params[key] = value
      } catch {
        if (rawKey) params[rawKey] = rawVal
      }
    })
  return Object.keys(params).length ? { url, params } : { url }
}

function hydrateHttpFromQueryUrl(target: Record<string, unknown> | undefined): void {
  if (!target) return
  if (typeof target.queryUrl !== 'string' || !target.queryUrl) return
  if (target.url != null && target.url !== '') return
  const parsed = splitQueryUrl(target.queryUrl)
  target.url = parsed.url
  if (target.params == null && parsed.params) {
    target.params = parsed.params
  }
}

function hydrateCollectedAliases(data: LogData): void {
  const rec = data as LogData & {
    resourcePrefs?: Array<Record<string, number>>
    meta?: Record<string, unknown>
  }
  const prefs = rec.resourcePrefs
  if (Array.isArray(prefs)) {
    prefs.forEach((row) => {
      if (row && row.request == null && row.ttfb != null) {
        row.request = row.ttfb
      }
    })
  }
  hydrateHttpFromQueryUrl(rec as Record<string, unknown>)
  hydrateHttpFromQueryUrl(rec.meta)
}

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
    return { ...data } as SaveLogRequest
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

      hydrateCollectedAliases(merged)

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
