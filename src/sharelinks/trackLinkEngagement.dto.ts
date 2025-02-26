import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TrackLinkEngagementDto {
  @ApiProperty({ description: 'IP address of the visitor', required: false })
  @IsString()
  @IsOptional()
  readonly ip_address?: string;

  @ApiProperty({ description: 'User agent of the visitor', required: false })
  @IsString()
  @IsOptional()
  readonly user_agent?: string;

  @ApiProperty({ description: 'Referrer URL', required: false })
  @IsString()
  @IsOptional()
  readonly referrer?: string;
}
