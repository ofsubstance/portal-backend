import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateShareLinkDto {
  @ApiProperty({
    description: 'Expiration time in days (optional, default is 30 days)',
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  readonly validity_days?: number;

  @ApiProperty({ description: 'ID of the video to share' })
  @IsString()
  readonly video_id: string;
}
