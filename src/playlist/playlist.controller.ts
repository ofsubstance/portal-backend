import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { Tag } from 'src/enums/tag.enum';
import { CreateUpdatePlaylistDto } from './dto/playlist.dto';
import { PlaylistService } from './playlist.service';

@Catch()
@ApiTags('Playlists')
@Controller('playlists')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Public()
  @Get('/carousel')
  async findCarouselList() {
    return await this.playlistService.findCarouselList();
  }

  @Public()
  @Get('/top-picks')
  async findTopPicks() {
    return await this.playlistService.findTopPicks();
  }

  @Public()
  @Get('/')
  async findAllPlaylists() {
    return await this.playlistService.findAllPlaylists();
  }

  @Public()
  @Get('/tag/:tag')
  async findPlaylistByTag(@Param('tag') tag: Tag) {
    return await this.playlistService.findPlaylistByTag(tag);
  }

  @Roles(Role.Admin)
  @Get('/:id')
  async findPlaylist(@Param('id') id: string) {
    return await this.playlistService.findPlaylist(id);
  }

  @Roles(Role.Admin)
  @Post()
  async createPlaylist(@Body() playlist: CreateUpdatePlaylistDto) {
    return await this.playlistService.createPlaylist(playlist);
  }

  @Roles(Role.Admin)
  @Patch('/:id')
  async updatePlaylist(
    @Param('id') id: string,
    @Body() playlist: CreateUpdatePlaylistDto,
  ) {
    return await this.playlistService.updatePlaylist(id, playlist);
  }

  @Roles(Role.Admin)
  @Delete('/:id')
  async removePlaylist(@Param('id') id: string) {
    return await this.playlistService.removePlaylist(id);
  }
}
