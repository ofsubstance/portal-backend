import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; role: Role };
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** Admin only — list every user */
  @Roles(Role.Admin)
  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  /** Any authenticated user — own profile only; admin may access any */
  @Get('/:id')
  findUser(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.findUser(id);
  }

  /** Any authenticated user — own engagement only; admin may access any */
  @Get('/:id/engagement')
  @ApiOperation({ summary: 'Get user engagement data' })
  @ApiResponse({
    status: 200,
    description:
      'Returns user engagement metrics including watch sessions, shareable links, and content engagement statistics',
  })
  getUserEngagement(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.getUserEngagement(id);
  }

  /** Any authenticated user — own profile only; admin may update anyone.
   *  Non-admin users cannot change their own role. */
  @Patch('/:id')
  updateUser(
    @Param('id') id: string,
    @Body() attributes: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.Admin && req.user.id !== id) {
      throw new ForbiddenException();
    }

    // Only admins may change the role field — strip it for regular users
    const { role: _stripped, ...withoutRole } = attributes;
    const finalAttributes =
      req.user.role === Role.Admin ? attributes : withoutRole;

    return this.usersService.updateUser(id, finalAttributes);
  }

  /** Admin only — hard delete a user */
  @Roles(Role.Admin)
  @Delete('/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  /** Authenticated — update own first-content-engagement timestamp only */
  @Patch('/:id/content-engagement')
  async updateFirstContentEngagement(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException();
    }
    await this.usersService.updateFirstContentEngagement(id);
    return { success: true };
  }
}
