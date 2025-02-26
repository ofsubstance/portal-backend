import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This video was very insightful!' })
  @IsString()
  readonly text: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  readonly videoId: string;
}
