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
import { VideoService } from './video.service';

@Catch()
@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Get()
  findAllVideos() {
    return this.videoService.findAllVideos();
  }

  @Get('/:id')
  findVideoById(@Param('id') id: string) {
    return this.videoService.findVideoById(id);
  }

  @Get('/genre/:genre')
  findVideoByGenre(@Param('genre') genre: string) {
    return this.videoService.findVideosByGenre(genre);
  }

  @Get('/search/:keyword')
  findVideoBySearch(@Param('keyword') keyword: string) {
    return this.videoService.searchVideo(keyword);
  }

  @Post()
  createVideo(@Body() attributes: any) {
    return this.videoService.createVideo(attributes);
  }

  @Patch('/:id')
  updateVideo(@Param('id') id: string, @Body() attributes: any) {
    return this.videoService.updateVideo(id, attributes);
  }

  @Delete('/:id')
  deleteVideo(@Param('id') id: string) {
    return this.videoService.deleteVideo(id);
  }
}
