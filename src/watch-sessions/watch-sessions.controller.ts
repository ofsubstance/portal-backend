import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../decorators/auth.decorator';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { WatchSession } from '../entities/watch_sessions.entity';
import { UserSessionsService } from '../user-sessions/user-sessions.service';
import { CreateWatchSessionDto } from './dto/create-watch-session.dto';
import { UpdateWatchSessionDto } from './dto/update-watch-session.dto';
import { WatchSessionsService } from './watch-sessions.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; role: Role };
}

@ApiTags('Watch Sessions')
@Controller('watch-sessions')
export class WatchSessionsController {
  constructor(
    private readonly watchSessionsService: WatchSessionsService,
    private readonly userSessionsService: UserSessionsService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new watch session' })
  @ApiResponse({
    status: 201,
    description: 'The watch session has been successfully created.',
    type: WatchSession,
  })
  async createWatchSession(
    @Body() createWatchSessionDto: CreateWatchSessionDto,
  ): Promise<WatchSession> {
    return this.watchSessionsService.createWatchSession(createWatchSessionDto);
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a watch session' })
  @ApiResponse({
    status: 200,
    description: 'The watch session has been successfully updated.',
    type: WatchSession,
  })
  async updateWatchSession(
    @Param('id') id: string,
    @Body() updateWatchSessionDto: UpdateWatchSessionDto,
  ): Promise<WatchSession> {
    return this.watchSessionsService.updateWatchSession(
      id,
      updateWatchSessionDto,
    );
  }

  @Roles(Role.Admin)
  @Get()
  @ApiOperation({ summary: 'Get all watch sessions (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all watch sessions',
    type: [WatchSession],
  })
  async findAllWatchSessions(): Promise<WatchSession[]> {
    return this.watchSessionsService.findAllWatchSessions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a watch session by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the watch session',
    type: WatchSession,
  })
  async findWatchSessionById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WatchSession> {
    const watchSession = await this.watchSessionsService.findWatchSessionById(id);

    if (req.user.role !== Role.Admin) {
      const ownerId = watchSession.userSession?.userId;
      if (!ownerId || ownerId !== req.user.id) {
        throw new ForbiddenException();
      }
    }

    return watchSession;
  }

  @Get('user-session/:userSessionId')
  @ApiOperation({ summary: 'Get watch sessions by user session ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns watch sessions for the specified user session',
    type: [WatchSession],
  })
  async findWatchSessionsByUserSessionId(
    @Param('userSessionId') userSessionId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WatchSession[]> {
    if (req.user.role !== Role.Admin) {
      const userSession = await this.userSessionsService.findById(userSessionId);
      if (!userSession) {
        throw new NotFoundException(
          `User session with ID ${userSessionId} not found`,
        );
      }
      if (userSession.userId !== req.user.id) {
        throw new ForbiddenException();
      }
    }

    return this.watchSessionsService.findWatchSessionsByUserSessionId(
      userSessionId,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get watch sessions by user ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns watch sessions for the specified user',
    type: [WatchSession],
  })
  async findWatchSessionsByUserId(
    @Param('userId') userId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<WatchSession[]> {
    if (req.user.role !== Role.Admin && req.user.id !== userId) {
      throw new ForbiddenException();
    }
    return this.watchSessionsService.findWatchSessionsByUserId(userId);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a watch session (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'The watch session has been successfully deleted.',
  })
  async deleteWatchSession(@Param('id') id: string): Promise<void> {
    return this.watchSessionsService.deleteWatchSession(id);
  }
}
