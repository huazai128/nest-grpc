import { Type } from 'class-transformer'
import { IsInt } from 'class-validator'

export class ActionDetailPageQueryDTO {
  @IsInt()
  @Type(() => Number)
  id: number
}
