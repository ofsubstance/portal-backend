import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Utilization } from 'src/enums/utilization.enum';

export class ProfileDto {
  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  readonly businessName: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  readonly website: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  readonly stateRegion: string;

  @ApiProperty({ example: 'Bangladesh' })
  @IsString()
  readonly country: string;

  @ApiProperty({ example: 'personal' })
  @IsEnum(Utilization)
  readonly utilizationPurpose: Utilization;

  @ApiProperty({ example: ['1', '2'] })
  @IsString({ each: true })
  readonly interests: string[];
}

export class SignUpDto {
  @ApiProperty({ example: 'example@gmail.com' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  readonly password: string;

  @ApiProperty()
  @IsBoolean()
  readonly smsConsent: boolean;

  @ApiProperty()
  @IsBoolean()
  readonly emailTermsConsent: boolean;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  readonly firstname: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  readonly lastname: string;

  @ApiProperty({ example: '01712345678' })
  @IsString()
  readonly phone: string;

  @ApiProperty({ type: ProfileDto })
  readonly profile: ProfileDto;
}
