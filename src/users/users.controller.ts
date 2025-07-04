import {
    Body,
    Catch,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Catch()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/:id')
  findUser(@Param('id') id: string) {
    return this.usersService.findUser(id);
  }

  @Get()
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get('/:id/engagement')
  @ApiOperation({ summary: 'Get user engagement data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user engagement metrics including watch sessions, shareable links, and content engagement statistics' 
  })
  getUserEngagement(@Param('id') id: string) {
    return this.usersService.getUserEngagement(id);
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() attributes: UpdateUserDto) {
    return this.usersService.updateUser(id, attributes);
  }

  @Delete('/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Public()
  @Patch('/:id/content-engagement')
  async updateFirstContentEngagement(@Param('id') id: string) {
    await this.usersService.updateFirstContentEngagement(id);
    return { success: true };
  }
}
