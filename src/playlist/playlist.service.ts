import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from 'src/entities/playlist.entity';
import { Video } from 'src/entities/video.entity';
import { Tag } from 'src/enums/tag.enum';
import { successHandler } from 'src/utils/response.handler';
import { Repository } from 'typeorm';
import { CreateUpdatePlaylistDto } from './dto/playlist.dto';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist) private playlistRepo: Repository<Playlist>,
    @InjectRepository(Video) private videoRepo: Repository<Video>,
  ) {}

  async createPlaylist(createPlaylistDto: CreateUpdatePlaylistDto) {
    const videos = await Promise.all(
      createPlaylistDto.videos.map(async (videoId) => {
        return await this.videoRepo.findOneBy({ id: videoId });
      }),
    );

    const playlist = this.playlistRepo.create({
      title: createPlaylistDto.title,
      description: createPlaylistDto.description,
      tag: createPlaylistDto.tag,
      videos: videos,
    });

    await this.playlistRepo.save(playlist);

    return successHandler('Playlist created', playlist);
  }

  findAllPlaylists() {
    const playlists = this.playlistRepo.find();

    return successHandler('Playlists found', playlists);
  }

  findPlaylist(id: string) {
    const playlist = this.playlistRepo.findOneBy({ id: id });

    return successHandler('Playlist found', playlist);
  }

  findCarouselList() {
    const carouselList = this.playlistRepo.findOneBy({ tag: Tag.Carousel });

    return successHandler('Carousel list found', carouselList);
  }

  findTopPicks() {
    const topPicks = this.playlistRepo.findOneBy({ tag: Tag.TopPicks });

    return successHandler('Top picks found', topPicks);
  }

  async updatePlaylist(id: string, updatePlaylistDto: CreateUpdatePlaylistDto) {
    const playlist = await this.playlistRepo.findOneBy({ id: id });
    if (!playlist) {
      return successHandler('Playlist not found', null);
    }

    const videos = await Promise.all(
      updatePlaylistDto.videos.map(async (videoId) => {
        return await this.videoRepo.findOneBy({ id: videoId });
      }),
    );

    playlist.title = updatePlaylistDto.title;
    playlist.description = updatePlaylistDto.description;
    playlist.tag = updatePlaylistDto.tag;
    playlist.videos = videos;

    await this.playlistRepo.save(playlist);

    return successHandler('Playlist updated', playlist);
  }

  async removePlaylist(id: string) {
    await this.playlistRepo.delete({ id: id });
    return successHandler('Playlist deleted', null);
  }
}
