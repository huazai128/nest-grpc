import { MetricsName } from '@app/constants/enum.contant'
import { PaginateSortDTO } from '@app/models/paginate.model'
import { DateQueryDTO, KeywordDTO, SiteIdQueryDTO, TimeSlotQueryDTO, KeyIdQueryDTO } from '@app/models/query.model'
import { IntersectionType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ErrorDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  type: string

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  path?: string
}

export class ErrorPaginateDTO extends IntersectionType(
  PaginateSortDTO,
  KeywordDTO,
  DateQueryDTO,
  ErrorDTO,
  SiteIdQueryDTO,
  KeyIdQueryDTO,
) {}

export class ErrorChartDTO extends IntersectionType(
  KeywordDTO,
  DateQueryDTO,
  ErrorDTO,
  SiteIdQueryDTO,
  TimeSlotQueryDTO,
  KeyIdQueryDTO,
) {}

export class ErrorAggregatePaginateDTO extends IntersectionType(ErrorPaginateDTO) {
  reportsType: MetricsName
}

export type ErrorAggregateDTO = Omit<ErrorAggregatePaginateDTO, 'page' | 'size'> & {
  reportsType: MetricsName
}
