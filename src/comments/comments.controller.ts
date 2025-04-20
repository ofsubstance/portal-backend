import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  createComment(@Req() req, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.createComment(req.user.id, createCommentDto);
  }

  @Public()
  @Get()
  findAllComments(@Req() req) {
    return this.commentsService.findAllComments();
  }

  @Public()
  @Get('video/:videoId')
  findCommentsByVideo(@Param('videoId') videoId: string, @Req() req) {
    return this.commentsService.findCommentsByVideo(videoId, req.user.id);
  }

  @Public()
  @Get('user/me')
  findMyComments(@Req() req) {
    return this.commentsService.findUserComments(req.user.id);
  }

  // @Roles(Role.Admin)
  @Put(':id/status')
  updateCommentStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCommentStatusDto,
    @Req() req,
  ) {
    return this.commentsService.updateCommentStatus(
      id,
      req.user.id,
      updateStatusDto,
    );
  }

  @Delete(':id')
  deleteComment(@Param('id') id: string, @Req() req) {
    return this.commentsService.deleteComment(id, req.user.id);
  }
}
