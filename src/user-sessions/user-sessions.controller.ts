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
    this.logger.log(
      `Heartbeat received for session ${sessionId} at ${new Date().toISOString()}`,
    );

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
        sessionId: result.newSession.sessionId,
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
    this.logger.log(
      `Fetching active sessions for user ${userId} at ${new Date().toISOString()}`,
    );

    const sessions =
      await this.userSessionsService.getUserActiveSessions(userId);
    this.logger.log(
      `Found ${sessions.length} active sessions for user ${userId}`,
    );

    return sessions;
  }

  @Post('end/:sessionId')
  async endSession(
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ) {
    this.logger.log(
      `Ending session ${sessionId} at ${new Date().toISOString()}`,
    );

    // Verify the session belongs to the authenticated user
    const session = await this.userSessionsService.getActiveSession(sessionId);

    if (session.userId !== req.user.id) {
      return {
        status: 'error',
        message: 'Unauthorized to end this session',
      };
    }

    await this.userSessionsService.endSession(sessionId);
    this.logger.log(`Session ${sessionId} ended successfully`);

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

    this.logger.log(
      `Updating content engaged status for session ${sessionId} to ${contentEngagedDto.engaged}`,
    );

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
