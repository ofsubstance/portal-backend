import { Controller, Get, Headers, NotFoundException } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { UserContentService } from './user-content.service';

@ApiTags('User Content')
@Controller('user-content')
export class UserContentController {
  constructor(private userContentService: UserContentService) {}

  @Public()
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieves user information along with their profile details including business name, website, location, purpose of use, and interests',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'User profile retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            firstname: { type: 'string', example: 'John' },
            lastname: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            role: { type: 'string', example: 'User' },
            status: { type: 'string', example: 'Active' },
            last_login: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            profile: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '123e4567-e89b-12d3-a456-426614174001',
                },
                business_name: { type: 'string', example: 'Acme Inc.' },
                website: { type: 'string', example: 'https://www.acme.com' },
                state_region: { type: 'string', example: 'California' },
                country: { type: 'string', example: 'United States' },
                utilization_purpose: { type: 'string', example: 'Education' },
                interests: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['Leadership', 'Personal Growth', 'Team Building'],
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or user ID not provided',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID for fetching content',
    required: true,
  })
  async getUserProfile(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID not provided in headers');
    }
    return this.userContentService.getUserProfile(userId);
  }

  @Public()
  @Get('comments')
  @ApiOperation({
    summary: 'Get user comments',
    description: 'Retrieves all comments created by a user',
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({
    status: 404,
    description: 'User not found or user ID not provided',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID for fetching content',
    required: true,
  })
  async getUserComments(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID not provided in headers');
    }
    return this.userContentService.getUserComments(userId);
  }

  @Public()
  @Get('feedbacks')
  @ApiOperation({
    summary: 'Get user feedbacks',
    description:
      'Retrieves all feedbacks submitted by a user with ratings for engagement, subject matter usefulness, outcome improvement, continuation likelihood, and recommendation likelihood, along with open-ended feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedbacks retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or user ID not provided',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID for fetching content',
    required: true,
  })
  async getUserFeedbacks(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID not provided in headers');
    }
    return this.userContentService.getUserFeedbacks(userId);
  }

  @Public()
  @Get('sharelinks')
  @ApiOperation({
    summary: 'Get user shareable links',
    description: 'Retrieves all shareable links created by a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Shareable links retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or user ID not provided',
  })
  @ApiHeader({
    name: 'x-user-id',
    description: 'User ID for fetching content',
    required: true,
  })
  async getUserShareLinks(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID not provided in headers');
    }
    return this.userContentService.getUserShareableLinks(userId);
  }
}
