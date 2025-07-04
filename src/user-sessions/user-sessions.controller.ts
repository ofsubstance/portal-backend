import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard';
import { UserSessionsService } from './user-sessions.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

class ContentEngagedDto {
  engaged: boolean;
}

@ApiTags('User Sessions')
@Controller('user-sessions')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UserSessionsController {
  private readonly logger = new Logger('UserSessionsController');

  constructor(private readonly userSessionsService: UserSessionsService) {}

  @Post('heartbeat/:sessionId')
  async heartbeat(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ): Promise<{ status: string; needsNewSession: boolean; sessionId?: string }> {
    const result = await this.userSessionsService.updateLastActive(
      sessionId,
      req,
    );

    if (result.status === 'active') {
      return {
        status: 'active',
        needsNewSession: false,
      };
    } else if (result.status === 'renewed' && result.newSession) {
      return {
        status: 'renewed',
        needsNewSession: false,
        sessionId: result.newSession.id,
      };
    } else {
      return {
        status: 'expired',
        needsNewSession: true,
      };
    }
  }

  @Get()
  async getUserSessions(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const sessions =
      await this.userSessionsService.getUserActiveSessions(userId);

    return sessions;
  }

  @Post('end/:sessionId')
  async endSession(
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ) {
    // Verify the session belongs to the authenticated user
    const session = await this.userSessionsService.getActiveSession(sessionId);

    if (session.userId !== req.user.id) {
      return {
        status: 'error',
        message: 'Unauthorized to end this session',
      };
    }

    await this.userSessionsService.endSession(sessionId);

    return { status: 'success' };
  }

  @Patch(':sessionId/content-engaged')
  @ApiBody({
    type: ContentEngagedDto,
    description: 'Update the content engaged status for a session',
  })
  async updateContentEngaged(
    @Param('sessionId') sessionId: string,
    @Body() contentEngagedDto: ContentEngagedDto,
    @Req() req: RequestWithUser,
  ) {
    // Verify the session belongs to the authenticated user
    const session = await this.userSessionsService.getActiveSession(sessionId);

    if (session.userId !== req.user.id) {
      return {
        status: 'error',
        message: 'Unauthorized to update this session',
      };
    }

    const updatedSession = await this.userSessionsService.updateContentEngaged(
      sessionId,
      contentEngagedDto.engaged,
    );

    return {
      status: 'success',
      message: `Content engaged status updated to ${contentEngagedDto.engaged}`,
      sessionId,
      contentEngaged: updatedSession.contentEngaged,
    };
  }
}
