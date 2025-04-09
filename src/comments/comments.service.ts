import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comments.entity';
import { User } from 'src/entities/users.entity';
import { Video } from 'src/entities/videos.entity';
import { CommentStatus } from 'src/enums/comment-status.enum';
import { Role } from 'src/enums/role.enum';
import { errorhandler, successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { text, videoId } = createCommentDto;

    // Check if video exists
    const video = await this.videoRepo.findOneBy({ id: videoId });
    if (!video) return errorhandler(404, 'Video not found');

    // Check if user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return errorhandler(404, 'User not found');

    // Create and save the comment
    const comment = this.commentRepo.create({
      text,
      video,
      user,
      status: CommentStatus.Pending,
    });

    const savedComment = await this.commentRepo.save(comment);
    return successHandler('Comment created successfully', savedComment);
  }

  async findAllComments() {
    

      const comments = await this.commentRepo.find({
        relations: ['user', 'video'],
      });
      return successHandler('All comments retrieved', comments);

  }

  async findCommentsByVideo(videoId: string, userId: string) {
    // Check if video exists
    const video = await this.videoRepo.findOneBy({ id: videoId });
    if (!video) return errorhandler(404, 'Video not found');

    // Check if user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return errorhandler(404, 'User not found');

    // If admin, return all comments for the video
    if (user.role === Role.Admin) {
      const comments = await this.commentRepo.find({
        where: { video: { id: videoId } },
        relations: ['user', 'video'],
      });
      return successHandler('All comments for video retrieved', comments);
    }

    // If regular user, return only approved comments for the video
    const comments = await this.commentRepo.find({
      where: { video: { id: videoId }, status: CommentStatus.Approved },
      relations: ['user', 'video'],
    });
    return successHandler('Approved comments for video retrieved', comments);
  }

  async findUserComments(userId: string) {
    // Check if user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return errorhandler(404, 'User not found');

    // Return all comments made by the user
    const comments = await this.commentRepo.find({
      where: { user: { id: userId } },
      relations: ['video'],
    });
    return successHandler('User comments retrieved', comments);
  }

  async updateCommentStatus(
    commentId: string,
    userId: string,
    updateStatusDto: UpdateCommentStatusDto,
  ) {
    // Check if user is admin
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return errorhandler(404, 'User not found');
    console.log(user);
    if (user.role !== Role.Admin) return errorhandler(403, 'Unauthorized');

    // Find the comment
    const comment = await this.commentRepo.findOneBy({ id: commentId });
    if (!comment) return errorhandler(404, 'Comment not found');

    // Update comment status
    comment.status = updateStatusDto.status;
    const updatedComment = await this.commentRepo.save(comment);
    return successHandler('Comment status updated', updatedComment);
  }

  async deleteComment(commentId: string, userId: string) {
    // Check if user exists
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return errorhandler(404, 'User not found');

    // Find the comment
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['user'],
    });
    if (!comment) return errorhandler(404, 'Comment not found');

    // Check if user is admin or the comment owner
    if (user.role !== Role.Admin && comment.user.id !== userId) {
      return errorhandler(403, 'Unauthorized');
    }

    // Delete the comment
    await this.commentRepo.remove(comment);
    return successHandler('Comment deleted successfully', null);
  }
}
