import { Inject, Injectable } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { ExpansionService as ExpansionServiceT, FileChunk } from '@app/protos/expansion'
import { Multer } from 'multer'
import { ReplaySubject } from 'rxjs'

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

    // 假设我们将文件分成多个块，每个块大小为1MB
    const chunkSize = 1024 * 1024 // 1MB
    const totalChunks = Math.ceil(file.buffer.length / chunkSize)

    // 分片上传
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.buffer.length)
      const chunk = file.buffer.slice(start, end)

      chunks$.next({
        content: chunk,
        filename: file.originalname,
        chunkIndex: i,
        totalChunks: totalChunks,
        siteId,
      })
    }

    chunks$.complete()

    return this.expansionService.uploadZipFileStream(chunks$.asObservable())
  }
}
