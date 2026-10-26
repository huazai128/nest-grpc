import { CONFIG } from '@app/config'
import { buildKafkaClientConfig, resolveKafkaBrokers } from '@app/config/kafka.config'
import { MONITOR_TOPIC } from '@app/constants/kafka.contant'
import { LogData } from '@app/modules/log/log.dto'
import logger from '@app/utils/logger'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { CompressionTypes, Kafka, Partitioners, Producer } from 'kafkajs'
import { catchError, from, Observable, of } from 'rxjs'

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private topic = MONITOR_TOPIC
  private kafka!: Kafka
  private producer!: Producer
  private connected = false

  async onModuleInit() {
    this.initClient()
    void this.connectWithRetry().catch((error) => {
      logger.error('Kafka producer 后台连接失败，将在发送时重试', error)
    })
  }

  async onModuleDestroy() {
    this.connected = false
    await this.producer?.disconnect()
  }

  private initClient() {
    const kafkaOpts = CONFIG.kafkaOptions as { client?: { brokers?: string[] } } | undefined
    const brokers = resolveKafkaBrokers(kafkaOpts?.client?.brokers || [])
    this.kafka = new Kafka({
      ...(buildKafkaClientConfig(brokers) as any),
      clientId: `markiMonitorId-producer-${process.env.NODE_APP_INSTANCE ?? process.pid}`,
    })
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      allowAutoTopicCreation: false,
      ...(CONFIG.kafkaOptions?.producer || {}),
    })
  }

  private async connectWithRetry(maxRetries = 20) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.producer.connect()
        this.connected = true
        logger.info('Kafka producer 连接成功', brokersLabel())
        return
      } catch (error) {
        this.connected = false
        logger.error(`Kafka producer 连接失败 (${attempt}/${maxRetries})`, error)
        if (attempt === maxRetries) {
          throw error
        }
        await sleep(Math.min(attempt * 2000, 10000))
      }
    }
  }

  private async ensureConnected() {
    if (this.connected) {
      return
    }
    await this.connectWithRetry(5)
  }

  private getSendOptions() {
    return {
      ...(CONFIG.kafkaOptions?.send || {}),
      compression: CompressionTypes.GZIP,
    }
  }

  private async sendRecords(records: Array<{ value: string }>): Promise<void> {
    await this.ensureConnected()
    const sendOptions = this.getSendOptions()
    try {
      await this.producer.send({
        topic: this.topic,
        messages: records,
        ...sendOptions,
      })
    } catch (error) {
      this.connected = false
      logger.error('Kafka producer 发送失败，准备重连后重试', error)
      await this.connectWithRetry(5)
      await this.producer.send({
        topic: this.topic,
        messages: records,
        ...sendOptions,
      })
    }
  }

  private async sendToKafka(data: LogData) {
    const value = JSON.stringify(data)
    await this.sendRecords([{ value }])
    return data
  }

  /** 单条入队（兼容旧调用） */
  public sendMessage(data: LogData): Observable<LogData | string> {
    return from(this.sendToKafka(data)).pipe(catchError(() => of('fail')))
  }

  /** 批量入队：一次 network round-trip，适合 /multi */
  public async sendMessageBatch(dataList: LogData[]): Promise<'ok' | 'fail'> {
    if (!dataList.length) return 'ok'
    try {
      const records = dataList.map((data) => ({ value: JSON.stringify(data) }))
      await this.sendRecords(records)
      return 'ok'
    } catch (error) {
      logger.error('Kafka 批量发送失败', error)
      return 'fail'
    }
  }
}

const brokersLabel = () => {
  const kafkaOpts = CONFIG.kafkaOptions as { client?: { brokers?: string[] } } | undefined
  const brokers = resolveKafkaBrokers(kafkaOpts?.client?.brokers || [])
  return brokers.join(',')
}
