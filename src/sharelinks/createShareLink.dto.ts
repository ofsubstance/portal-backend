import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateShareLinkDto {
  @ApiProperty()
  @IsString()
  readonly expiration_time: Date;

  @ApiProperty()
  @IsString()
  readonly video_id: string;
}
