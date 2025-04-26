import { Injectable } from '@nestjs/common'

@Injectable()
export class ExpansionService {
  /**
   * 上传
   * @memberof ExpansionService
   */
  public async uploadZip() {
    return { msg: '上传成功' }
  }
}
