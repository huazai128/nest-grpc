import { Inject, Injectable } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { ExpansionService as ExpansionServiceT } from '@app/protos/expansion'
import { Multer } from 'multer'

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
  public async uploadZip(file: Multer.File & { buffer: Buffer }, fileId: string) {
    return this.expansionService.uploadZipFileStream({
      content: file.buffer,
      filename: file.originalname,
      chunkIndex: 0,
      totalChunks: 1,
      fileId,
    })
  }
}
