import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CredLoginDto {
  @ApiProperty({ example: 'tausifahmed4802@gmail.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'blue1998' })
  @IsString()
  readonly password: string;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google OAuth access token' })
  @IsString()
  readonly accessToken: string;
}
