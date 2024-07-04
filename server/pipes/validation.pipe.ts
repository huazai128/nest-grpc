import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'

/**
 * 类装饰器数据类型校验
 * @export
 * @class ValidationPipe
 * @implements {PipeTransform<any>}
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (this.toValidate(metatype)) {
      return value
    }
    const object = plainToClass(metatype, value)
    const errors = await validate(object)
    if (errors.length > 0) {
      const messages: string[] = []
      const pushMessage = (constraints = {}) => {
        messages.push(...Object.values<any>(constraints))
      }
      errors.forEach((error) => {
        if (error.constraints) {
          pushMessage(error.constraints)
        }
        if (error.children) {
          error.children.forEach((e) => pushMessage(e.constraints))
        }
      })
      throw new BadRequestException('参数错误：' + messages.join(', '))
    }
    return object
  }

  private toValidate(metatype: any): metatype is undefined {
    const types = [String, Boolean, Number, Array, Object]
    return !metatype || types.includes(metatype)
  }
}
