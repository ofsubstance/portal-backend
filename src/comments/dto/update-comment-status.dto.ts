import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CommentStatus } from 'src/enums/comment-status.enum';

export class UpdateCommentStatusDto {
  @ApiProperty({
    enum: CommentStatus,
    example: CommentStatus.Approved,
    description: 'Status of the comment',
  })
  @IsEnum(CommentStatus)
  readonly status: CommentStatus;
}
