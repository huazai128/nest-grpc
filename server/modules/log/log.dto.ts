import { MetricsName, TransportCategory } from '@app/constants/enum.contant'
import { PaginateSortDTO } from '@app/models/paginate.model'
import { DateQueryDTO, KeyIdQueryDTO, KeywordDTO, SiteIdQueryDTO, TimeSlotQueryDTO } from '@app/models/query.model'
import { SaveLogRequest } from '@app/protos/log'
import { MechanismTypes, MetricsTypes } from '@app/constants/report.contant'
import { IntersectionType } from '@nestjs/mapped-types'
import { IsOptional, IsString, IsIn, IsEnum } from 'class-validator'

// 日志数据接口
export interface LogData extends Partial<SaveLogRequest> {}

// 日志搜索基础DTO
export class LogSearchBaseDTO {
  @IsEnum(TransportCategory)
  @IsOptional()
  category?: TransportCategory

  @IsString()
  @IsOptional()
  traceId?: string
}

// 日志类型搜索DTO
export class LogTypeSearchDTO extends LogSearchBaseDTO {
  @IsIn([...MetricsTypes, ...MechanismTypes])
  @IsOptional()
  reportsType?: MetricsName
}

// 日志分页查询DTO
export class LogPaginateQueryDTO extends IntersectionType(
  PaginateSortDTO,
  KeywordDTO,
  DateQueryDTO,
  LogTypeSearchDTO,
  SiteIdQueryDTO,
  KeyIdQueryDTO,
) {}

// 日志图表查询DTO
export class LogChartQueryDTO extends IntersectionType(
  LogTypeSearchDTO,
  DateQueryDTO,
  KeywordDTO,
  SiteIdQueryDTO,
  TimeSlotQueryDTO,
  KeyIdQueryDTO,
) {}

// 日志聚合查询DTO
export class LogAggregationSearchDTO extends LogPaginateQueryDTO {
  @IsIn(['page', 'api'])
  @IsOptional()
  type?: string
}
