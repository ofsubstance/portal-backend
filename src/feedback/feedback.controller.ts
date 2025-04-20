import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Endpoint for users to submit feedback
  @Post()
  @ApiOperation({
    summary: 'Submit feedback',
    description: 'Submit feedback for a video',
  })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User or video not found' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID',
    required: true,
  })
  @ApiBearerAuth()
  async createFeedback(
    @Headers('x-user-id') userId: string,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided in headers');
    }
    return this.feedbackService.createFeedback(userId, createFeedbackDto);
  }

  // Get feedbacks for current user
  @Get('me')
  @ApiOperation({
    summary: 'Get feedbacks for current user',
    description: 'Retrieve all feedbacks submitted by the current user',
  })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID',
    required: true,
  })
  async getMyFeedbacks(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID not provided in headers');
    }
    return this.feedbackService.getFeedbacksByUser(userId);
  }

  // Get all feedbacks for a video
  @Public()
  @Get('video/:videoId')
  @ApiOperation({
    summary: 'Get feedbacks by video',
    description: 'Retrieve all feedbacks for a specific video',
  })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  async getFeedbacksByVideo(@Param('videoId') videoId: string) {
    return this.feedbackService.getFeedbacksByVideo(videoId);
  }

  // Get all feedbacks for a user
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get feedbacks by user',
    description: 'Retrieve all feedbacks submitted by a specific user',
  })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFeedbacksByUser(@Param('userId') userId: string) {
    return this.feedbackService.getFeedbacksByUser(userId);
  }

  // Get a specific feedback
  @Get(':id')
  @ApiOperation({
    summary: 'Get feedback by ID',
    description: 'Retrieve a specific feedback by its ID',
  })
  @ApiResponse({ status: 200, description: 'Feedback retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async getFeedbackById(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }
}
