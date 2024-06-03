import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from 'src/entities/playlist.entity';
import { Video } from 'src/entities/video.entity';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

@Module({
  controllers: [PlaylistController],
  providers: [PlaylistService],
  imports: [TypeOrmModule.forFeature([Playlist, Video])],
})
export class PlaylistModule {}
