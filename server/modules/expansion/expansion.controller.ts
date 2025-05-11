import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ExpansionService } from './expansion.service'
import { Responsor } from '@app/decorators/responsor.decorator'
import { createLogger } from '@app/utils/logger'

const logger = createLogger({
  scope: 'ExpansionController',
  time: true,
})

@Controller('api')
export class ExpansionController {
  constructor(private readonly uploadService: ExpansionService) {}

  /**
   * 文件zip上传(后续可以改成上传到云)
   * @param {*} files
   * @param {*} body
   * @return {*}
   * @memberof ExpansionController
   */
  @Post('upload-zip')
  @Responsor.api()
  @Responsor.handle('上传文件')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadZipFile(@UploadedFile() file, @Body() body) {
    logger.info('上传文件', body)
    return await this.uploadService.uploadZip(file, body.siteId)
  }
}
