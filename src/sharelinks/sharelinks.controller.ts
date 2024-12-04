import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { CreateShareLinkDto } from './createShareLink.dto';
import { SharelinksService } from './sharelinks.service';

@Catch()
@ApiTags('Shareable Links')
@Controller('sharelinks')
export class SharelinksController {
  constructor(private sharelinksService: SharelinksService) {}

  @Post()
  async createShareLink(
    @Body() createShareLinkDto: CreateShareLinkDto,
    @Req() request: any,
  ) {
    const userId = request.user.id;
    return await this.sharelinksService.createShareLink(
      createShareLinkDto,
      userId,
    );
  }

  @Get(':id')
  async findShareLinkById(@Param('id') id: string) {
    return await this.sharelinksService.getShareLinkById(id);
  }

  @Get('user/:userId')
  async findShareLinkByUser(@Param('userId') userId: string) {
    return await this.sharelinksService.getShareLinkByUserId(userId);
  }

  @Roles(Role.Admin)
  @Get()
  async getAllShareLinks() {
    return await this.sharelinksService.getAllShareLinks();
  }

  @Roles(Role.Admin)
  @Delete(':id')
  async deleteShareLink(@Param('id') id: string) {
    return await this.sharelinksService.deleteShareLink(id);
  }
}
