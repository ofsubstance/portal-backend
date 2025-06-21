import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { DurationSpan } from '../enums/duration-span.enum';

export class TimeFrameDto {
  @ApiProperty({
    description: 'Start date of the time frame',
    example: '2025-03-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date of the time frame',
    example: '2025-04-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Time span for data aggregation',
    enum: DurationSpan,
    default: DurationSpan.DAILY,
    required: false,
  })
  @IsEnum(DurationSpan)
  @IsOptional()
  span?: DurationSpan;
}
