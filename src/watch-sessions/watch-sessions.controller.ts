import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/auth.decorator';
import { WatchSession } from '../entities/watch_sessions.entity';
import { CreateWatchSessionDto } from './dto/create-watch-session.dto';
import { UpdateWatchSessionDto } from './dto/update-watch-session.dto';
import { WatchSessionsService } from './watch-sessions.service';

@ApiTags('Watch Sessions')
@Controller('watch-sessions')
export class WatchSessionsController {
  constructor(private readonly watchSessionsService: WatchSessionsService) {}

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
    console.log(createWatchSessionDto);
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
    console.log(updateWatchSessionDto);
    return this.watchSessionsService.updateWatchSession(
      id,
      updateWatchSessionDto,
    );
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all watch sessions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all watch sessions',
    type: [WatchSession],
  })
  async findAllWatchSessions(): Promise<WatchSession[]> {
    return this.watchSessionsService.findAllWatchSessions();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a watch session by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the watch session',
    type: WatchSession,
  })
  async findWatchSessionById(@Param('id') id: string): Promise<WatchSession> {
    return this.watchSessionsService.findWatchSessionById(id);
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
  ): Promise<WatchSession[]> {
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
  ): Promise<WatchSession[]> {
    return this.watchSessionsService.findWatchSessionsByUserId(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a watch session' })
  @ApiResponse({
    status: 204,
    description: 'The watch session has been successfully deleted.',
  })
  async deleteWatchSession(@Param('id') id: string): Promise<void> {
    return this.watchSessionsService.deleteWatchSession(id);
  }
}
