import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateUpdateVideoDto {
  @ApiProperty()
  @IsString()
  readonly video_url: string;

  @ApiProperty()
  @IsString()
  readonly trailer_url: string;

  @ApiProperty({ type: 'string', format: 'binary' })
  readonly thumbnail: File;

  @ApiProperty({ example: 'Hide your Crazy' })
  @IsString()
  readonly title: string;

  @ApiProperty({ example: '123456' })
  readonly genre: string;

  @ApiProperty({ example: '18:54' })
  @IsString()
  readonly duration: string;

  @ApiProperty({ example: 'random text' })
  @IsString()
  readonly short_desc: string;

  @ApiProperty({ example: 'Random about' })
  @IsString()
  readonly about: string;

  @ApiProperty({ example: 'Random primary lesson' })
  @IsString()
  readonly primary_lesson: string;

  @ApiProperty({ example: 'Random about' })
  @IsString()
  readonly theme: string;

  @ApiProperty({ example: 'Random about' })
  @IsString()
  readonly impact: string;

  @ApiProperty({ example: 10 })
  @IsString()
  readonly cost: number;
}
