import {
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { IntersectionType } from '@nestjs/mapped-types'
import { PaginateSortDTO } from '@app/models/paginate.model'
import { DateQueryDTO, KeywordDTO } from '@app/models/query.model'
import { Transform } from 'class-transformer'
import { unknownToNumber } from '@app/transformers/value.transform'
import { PublishState } from '@app/constants/enum.contant'

export const SITE_PUBLISH_STATES = [PublishState.Draft, PublishState.Published, PublishState.Recycle] as const

@ValidatorConstraint({ name: 'isValidIsApiValue', async: false })
export class IsValidIsApiValue implements ValidatorConstraintInterface {
  validate(value: any) {
    const isApi = value as number
    return isApi === 0 || isApi === 1
  }
  defaultMessage() {
    return 'isApi 字段值0 或 1'
  }
}

export class SiteDTO {
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

export class SitePaginateDTO extends IntersectionType(PaginateSortDTO, KeywordDTO, DateQueryDTO) {
  @IsIn(SITE_PUBLISH_STATES)
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  state?: PublishState

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  siteId: string
}
