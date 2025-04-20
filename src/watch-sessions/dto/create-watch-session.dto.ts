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

export class CreateWatchSessionDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userSessionId?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isGuestWatchSession?: boolean;

  @ApiProperty()
  @IsString()
  videoId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ApiProperty({
    description: 'Actual time watched in seconds (can include decimals)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  actualTimeWatched: number;

  @ApiProperty({ description: 'Percentage watched (can include decimals)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  percentageWatched: number;

  @ApiProperty({ required: false, type: 'array' })
  @IsObject({ each: true })
  @IsOptional()
  userEvent?: UserEvent[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  userMetadata?: UserMetadata;
}
