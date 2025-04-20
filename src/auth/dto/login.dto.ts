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
  @ApiProperty({ example: 'client@gmail.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: 'client' })
  @IsString()
  readonly name: string;
}
