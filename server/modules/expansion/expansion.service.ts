import { Inject, Injectable } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { ExpansionService as ExpansionServiceT, FileChunk } from '@app/protos/expansion'
import { Multer } from 'multer'
import { ReplaySubject } from 'rxjs'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({
  scope: 'ExpansionService',
  time: true,
})

/**
 * 上传文件
 * @memberof ExpansionService
 */
@Injectable()
export class ExpansionService {
  public expansionService: ExpansionServiceT

  constructor(@Inject('EXPANSION_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.expansionService = this.client.getService<ExpansionServiceT>('ExpansionService')
  }
  /**
   * 上传
   * @memberof ExpansionService
   */
  public async uploadZip(file: Multer.File & { buffer: Buffer }, siteId: string) {
    // 使用ReplaySubject分片传递
    const chunks$ = new ReplaySubject<FileChunk>()

    // 配置参数
    const chunkSize = 1024 * 1024 // 1MB
    const maxRetries = 3
    const retryDelay = 1000 // 1秒
    const totalChunks = Math.ceil(file.buffer.length / chunkSize)

    try {
      // 分片上传
      await Promise.all(
        Array.from({ length: totalChunks }, async (_, i) => {
          const start = i * chunkSize
          const end = Math.min(start + chunkSize, file.buffer.length)
          const chunk = file.buffer.slice(start, end)

          // 重试机制
          for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
            try {
              chunks$.next({
                content: chunk,
                filename: file.originalname,
                chunkIndex: i,
                totalChunks,
                siteId,
              })
              return // 成功则退出重试循环
            } catch (error) {
              if (retryCount === maxRetries - 1) {
                // 超过重试次数，发送告警
                logger.error(
                  `[告警] 文件上传失败: ${file.originalname}, 分片: ${i}/${totalChunks}, 站点ID: ${siteId}`,
                )
                // 这里可以添加更多告警逻辑，如发送邮件、短信或调用告警API
                throw new Error(`上传分片${i}失败，已重试${maxRetries}次: ${error.message}`)
              }
              // 等待后重试
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
            }
          }
        }),
      )

      chunks$.complete()
      return this.expansionService.uploadZipFileStream(chunks$.asObservable())
    } catch (error) {
      chunks$.error(error)
      // 整体上传失败时也发送告警
      console.error(`[告警] 文件整体上传失败: ${file.originalname}, 站点ID: ${siteId}, 错误: ${error.message}`)
      throw error
    }
  }
}
