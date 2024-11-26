import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/decorators/auth.decorator';
import { CreateUpdateVideoDto } from './dto/createUpdateVideo.dto';
import { VideoService } from './video.service';

@Catch()
@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Public()
  @Get()
  findAllVideos() {
    return this.videoService.findAllVideos();
  }

  @Public()
  @Get('/:id')
  findVideoById(@Param('id') id: string) {
    return this.videoService.findVideoById(id);
  }

  // @Get('/library/:userId')
  // findPurchasedVideos(@Param('userId') userId: string) {
  //   return this.videoService.findPurchasedVideos(userId);
  // }

  @Get('/genre/:genre')
  findVideoByGenre(@Param('genre') genre: string) {
    return this.videoService.findVideosByGenre(genre);
  }

  @Get('/search/:keyword')
  findVideoBySearch(@Param('keyword') keyword: string) {
    return this.videoService.searchVideos(keyword);
  }

  @Public()
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  createVideo(
    @UploadedFile() thumbnail: Express.Multer.File,
    @Body() attributes: CreateUpdateVideoDto,
  ) {
    return this.videoService.createVideo(thumbnail, attributes);
  }

  @Patch('/:id')
  updateVideo(
    @Param('id') id: string,
    @Body() attributes: Partial<CreateUpdateVideoDto>,
  ) {
    return this.videoService.updateVideo(id, attributes);
  }

  @Delete('/:id')
  deleteVideo(@Param('id') id: string) {
    return this.videoService.deleteVideo(id);
  }
}
