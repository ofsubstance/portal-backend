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
import { CreateUpdatePlaylistDto } from './dto/playlist.dto';
import { PlaylistService } from './playlist.service';

@Catch()
@ApiTags('Playlists')
@Controller('playlist')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Public()
  @Get('/carousel')
  findCarouselList() {
    return this.playlistService.findCarouselList();
  }

  @Public()
  @Get('/top-picks')
  findTopPicks() {
    return this.playlistService.findTopPicks();
  }

  @Roles(Role.Admin)
  @Get('/all')
  findAllPlaylists() {
    return this.playlistService.findAllPlaylists();
  }

  @Roles(Role.Admin)
  @Get('/:id')
  findPlaylist(@Param('id') id: string) {
    return this.playlistService.findPlaylist(id);
  }

  @Roles(Role.Admin)
  @Post()
  createPlaylist(@Body() playlist: CreateUpdatePlaylistDto) {
    return this.playlistService.createPlaylist(playlist);
  }

  @Roles(Role.Admin)
  @Patch('/:id')
  updatePlaylist(
    @Param('id') id: string,
    @Body() playlist: CreateUpdatePlaylistDto,
  ) {
    return this.playlistService.updatePlaylist(id, playlist);
  }

  @Roles(Role.Admin)
  @Delete('/:id')
  removePlaylist(@Param('id') id: string) {
    return this.playlistService.removePlaylist(id);
  }
}
