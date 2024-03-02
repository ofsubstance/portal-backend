import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  readonly name: string;

  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  @IsOptional()
  readonly email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsOptional()
  readonly password: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsOptional()
  readonly role: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsOptional()
  readonly address: string;

  @ApiProperty({ example: '01700000000' })
  @IsString()
  @IsOptional()
  readonly phone_primary: string;

  @ApiProperty({ example: '01700000001' })
  @IsString()
  @IsOptional()
  readonly phone_secondary: string;

  @ApiProperty({ example: 'Photographer' })
  @IsString()
  @IsOptional()
  readonly position: string;

  @ApiProperty({ example: 'NID' })
  @IsString()
  @IsOptional()
  readonly verification_type: string;

  @ApiProperty({ example: '12345678901234567' })
  @IsString()
  @IsOptional()
  readonly verification_id: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsOptional()
  readonly base_salary: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsOptional()
  readonly monthly_salary: number;
}
