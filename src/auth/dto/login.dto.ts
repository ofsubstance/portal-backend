import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CredLoginDto {
  @ApiProperty({ example: 'admin@gmail.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  readonly password: string;
}

export class GoogleLoginDto {
  @ApiProperty({ example: 'client@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'client' })
  @IsString()
  name: string;
}
