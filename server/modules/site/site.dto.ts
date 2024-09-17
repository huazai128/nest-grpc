import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUrl,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'isValidIsApiValue', async: false })
export class IsValidIsApiValue implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const isApi = value as number
    return isApi === 0 || isApi === 1
  }

  defaultMessage(args: ValidationArguments) {
    return 'isApi 字段值0 或 1'
  }
}

export class SitoDTO {
  @IsString({ message: '必须是字符串' })
  @IsNotEmpty({ message: '不能为空' })
  @IsDefined()
  name: string

  @IsInt()
  @IsNotEmpty({ message: '不能为空' })
  @Validate(IsValidIsApiValue)
  isApi: number

  @IsNotEmpty({ message: '不能为空' })
  @IsUrl()
  reportUrl: string
}
