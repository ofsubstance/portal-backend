import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  readonly name: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  readonly password: string;
}
