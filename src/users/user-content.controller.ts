import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from 'src/enums/role.enum';
import { UserContentService } from './user-content.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; role: Role };
}

@ApiTags('User Content')
@Controller('user-content')
export class UserContentController {
  constructor(private userContentService: UserContentService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get the authenticated user\'s profile',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getUserProfile(@Req() req: AuthenticatedRequest) {
    return this.userContentService.getUserProfile(req.user.id);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Get the authenticated user\'s comments' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getUserComments(@Req() req: AuthenticatedRequest) {
    return this.userContentService.getUserComments(req.user.id);
  }

  @Get('feedbacks')
  @ApiOperation({ summary: 'Get the authenticated user\'s feedbacks' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully' })
  async getUserFeedbacks(@Req() req: AuthenticatedRequest) {
    return this.userContentService.getUserFeedbacks(req.user.id);
  }

  @Get('sharelinks')
  @ApiOperation({ summary: 'Get the authenticated user\'s shareable links' })
  @ApiResponse({ status: 200, description: 'Shareable links retrieved successfully' })
  async getUserShareLinks(@Req() req: AuthenticatedRequest) {
    return this.userContentService.getUserShareableLinks(req.user.id);
  }
}
