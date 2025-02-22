import { IsDefined, IsNotEmpty, IsString } from 'class-validator'

export class AuthDTO {
  @IsString({ message: '账号必须是字符串' })
  @IsNotEmpty({ message: '账号不能为空' })
  @IsDefined({ message: '账号不能为空' })
  account: string

  @IsString({ message: '密码必须为字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsDefined({ message: '密码不能为空' })
  password: string
}
