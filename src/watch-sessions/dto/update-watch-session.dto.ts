import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserEvent, UserMetadata } from '../../entities/watch_sessions.entity';

export class UpdateWatchSessionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userSessionId?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isGuestWatchSession?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  videoId?: string;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startTime?: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;

  @ApiProperty({
    required: false,
    description: 'Actual time watched in seconds (can include decimals)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  actualTimeWatched?: number;

  @ApiProperty({
    required: false,
    description: 'Percentage watched (can include decimals)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  percentageWatched?: number;

  @ApiProperty({ required: false, type: 'array' })
  @IsObject({ each: true })
  @IsOptional()
  userEvent?: UserEvent[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  userMetadata?: UserMetadata;
}
