import {
  Body,
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
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/role.enum';
import { CreateUpdateVideoDto } from './dto/createUpdateVideo.dto';
import { VideoService } from './video.service';

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
  @Get('/search/:keyword')
  findVideoBySearch(@Param('keyword') keyword: string) {
    return this.videoService.searchVideos(keyword);
  }

  @Public()
  @Get('/genre/:genre')
  findVideoByGenre(@Param('genre') genre: string) {
    return this.videoService.findVideosByGenre(genre);
  }

  @Public()
  @Get('/tag/:tag')
  findVideoByTag(@Param('tag') tag: string) {
    return this.videoService.findVideosByTag(tag);
  }

  @Public()
  @Get('/:id')
  findVideoById(@Param('id') id: string) {
    return this.videoService.findVideoById(id);
  }

  @Roles(Role.Admin)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  createVideo(
    @UploadedFile() thumbnail: Express.Multer.File,
    @Body() attributes: CreateUpdateVideoDto,
  ) {
    return this.videoService.createVideo(thumbnail, attributes);
  }

  @Roles(Role.Admin)
  @Patch('/:id')
  updateVideo(
    @Param('id') id: string,
    @Body() attributes: Partial<CreateUpdateVideoDto>,
  ) {
    return this.videoService.updateVideo(id, attributes);
  }

  @Roles(Role.Admin)
  @Patch('/:id/thumbnail')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  updateVideoThumbnail(
    @Param('id') id: string,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    return this.videoService.updateVideoThumbnail(thumbnail, id);
  }

  @Roles(Role.Admin)
  @Delete('/:id')
  deleteVideo(@Param('id') id: string) {
    return this.videoService.deleteVideo(id);
  }
}
