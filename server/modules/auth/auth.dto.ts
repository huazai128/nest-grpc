import { IsDefined, IsNotEmpty, IsString } from 'class-validator'

export class AuthDTO {
  @IsString({ message: 'account must be string type' })
  @IsNotEmpty({ message: 'account?' })
  @IsDefined()
  @IsString()
  account: string

  @IsString({ message: 'password must be string type' })
  @IsNotEmpty({ message: 'password?' })
  @IsDefined()
  password: string
}
